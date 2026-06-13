import { buildPredictorSystemPrompt } from "@/lib/laboratorio/system-prompt";
import { canAccessQuizLab } from "@/lib/quiz/lab-access";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
const ANTHROPIC_VERSION = "2023-06-01";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

function parseMessages(body: unknown): ChatMessage[] {
  if (!body || typeof body !== "object" || !("messages" in body)) {
    throw new Error("Formato de solicitud invalido.");
  }

  const raw = (body as { messages: unknown }).messages;
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("Se requiere al menos un mensaje.");
  }

  return raw.map((entry) => {
    if (!entry || typeof entry !== "object") {
      throw new Error("Mensaje invalido.");
    }

    const role = (entry as { role?: unknown }).role;
    const content = (entry as { content?: unknown }).content;

    if (role !== "user" && role !== "assistant") {
      throw new Error("Rol de mensaje no permitido.");
    }

    if (typeof content !== "string" || !content.trim()) {
      throw new Error("El contenido del mensaje no puede estar vacio.");
    }

    return { role, content: content.trim() };
  });
}

function extractTextDeltaFromSseBlock(block: string): string | null {
  const dataLines = block
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice(6));

  if (dataLines.length === 0) {
    return null;
  }

  const payload = dataLines.join("\n");
  if (!payload || payload === "[DONE]") {
    return null;
  }

  try {
    const parsed = JSON.parse(payload) as {
      type?: string;
      delta?: { type?: string; text?: string };
    };

    if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
      return parsed.delta.text ?? null;
    }
  } catch {
    return null;
  }

  return null;
}

function createAnthropicTextTransformStream(
  upstream: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return upstream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });

        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const block = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);

          const text = extractTextDeltaFromSseBlock(block);
          if (text) {
            controller.enqueue(encoder.encode(text));
          }

          boundary = buffer.indexOf("\n\n");
        }
      },
      flush(controller) {
        const trailing = buffer.trim();
        if (!trailing) {
          return;
        }

        const text = extractTextDeltaFromSseBlock(trailing);
        if (text) {
          controller.enqueue(encoder.encode(text));
        }
      },
    }),
  );
}

async function assertPredictorAccess(): Promise<Response | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("No autenticado.", { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!canAccessQuizLab(profile?.username)) {
    return new Response("Acceso denegado.", { status: 403 });
  }

  return null;
}

export async function POST(request: Request) {
  const denied = await assertPredictorAccess();
  if (denied) {
    return denied;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return new Response("Servicio de predicciones no configurado.", { status: 500 });
  }

  let messages: ChatMessage[];
  try {
    messages = parseMessages(await request.json());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Solicitud invalida.";
    return new Response(message, { status: 400 });
  }

  const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1200,
      stream: true,
      system: buildPredictorSystemPrompt(),
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 5,
        },
      ],
      messages,
    }),
  });

  if (!anthropicResponse.ok || !anthropicResponse.body) {
    const detail = await anthropicResponse.text().catch(() => "");
    console.error("[laboratorio/predict] Anthropic error:", anthropicResponse.status, detail);
    return new Response("No se pudo generar la prediccion.", { status: 502 });
  }

  const textStream = createAnthropicTextTransformStream(anthropicResponse.body);

  return new Response(textStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
