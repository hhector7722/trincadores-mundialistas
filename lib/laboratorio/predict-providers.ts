import { buildPredictorSystemPrompt } from "@/lib/laboratorio/system-prompt";
import { isOpenAiQuotaOrBillingError } from "@/lib/laboratorio/is-openai-quota-error";
import {
  getGeminiApiKey,
  isGeminiConfigured,
  resolveGeminiModel,
} from "@/lib/ai-predictions/sources/gemini-client";

export type PredictorChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const OPENAI_MODEL = "gpt-4o";

type ProviderAttempt =
  | { ok: true; stream: ReadableStream<Uint8Array> }
  | { ok: false; retryWithGemini: boolean; status?: number; detail?: string };

function extractOpenAiTextDeltaFromSseBlock(block: string): string | null {
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
      delta?: string;
      error?: { message?: string };
    };

    if (parsed.type === "error") {
      throw new Error(parsed.error?.message ?? "Error en streaming de OpenAI.");
    }

    if (parsed.type === "response.output_text.delta" && typeof parsed.delta === "string") {
      return parsed.delta;
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }

  return null;
}

function extractGeminiTextFromSseBlock(block: string): string | null {
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
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
      error?: { message?: string };
    };

    if (parsed.error?.message) {
      throw new Error(parsed.error.message);
    }

    const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" && text.length > 0 ? text : null;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}

function createSseTextTransformStream(
  upstream: ReadableStream<Uint8Array>,
  extractText: (block: string) => string | null,
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

          const text = extractText(block);
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

        const text = extractText(trailing);
        if (text) {
          controller.enqueue(encoder.encode(text));
        }
      },
    }),
  );
}

async function tryOpenAiPredictStream(
  messages: PredictorChatMessage[],
): Promise<ProviderAttempt> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, retryWithGemini: true };
  }

  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: buildPredictorSystemPrompt(),
      input: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      tools: [{ type: "web_search" }],
      stream: true,
    }),
  });

  if (!openAiResponse.ok || !openAiResponse.body) {
    const detail = await openAiResponse.text().catch(() => "");
    const retryWithGemini = isOpenAiQuotaOrBillingError(openAiResponse.status, detail);
    console.error("[laboratorio/predict] OpenAI error:", openAiResponse.status, detail);
    return {
      ok: false,
      retryWithGemini,
      status: openAiResponse.status,
      detail,
    };
  }

  return {
    ok: true,
    stream: createSseTextTransformStream(openAiResponse.body, extractOpenAiTextDeltaFromSseBlock),
  };
}

async function streamGeminiPredict(messages: PredictorChatMessage[]): Promise<ReadableStream<Uint8Array>> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini no configurado.");
  }

  const model = resolveGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: buildPredictorSystemPrompt() }],
      },
      contents: messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
      tools: [{ google_search: {} }],
      generationConfig: {
        temperature: 0.35,
      },
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    console.error("[laboratorio/predict] Gemini error:", response.status, detail);
    throw new Error("No se pudo generar la prediccion.");
  }

  return createSseTextTransformStream(response.body, extractGeminiTextFromSseBlock);
}

export async function resolvePredictorStream(
  messages: PredictorChatMessage[],
): Promise<ReadableStream<Uint8Array>> {
  const openAiAttempt = await tryOpenAiPredictStream(messages);
  if (openAiAttempt.ok) {
    return openAiAttempt.stream;
  }

  if (!openAiAttempt.retryWithGemini) {
    throw new Error("No se pudo generar la prediccion.");
  }

  if (!isGeminiConfigured()) {
    throw new Error("No se pudo generar la prediccion.");
  }

  return streamGeminiPredict(messages);
}
