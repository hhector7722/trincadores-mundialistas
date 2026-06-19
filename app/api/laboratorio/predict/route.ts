import { canAccessQuizLab } from "@/lib/quiz/lab-access";
import { resolvePredictorStream, type PredictorChatMessage } from "@/lib/laboratorio/predict-providers";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseMessages(body: unknown): PredictorChatMessage[] {
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

  let messages: PredictorChatMessage[];
  try {
    messages = parseMessages(await request.json());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Solicitud invalida.";
    return new Response(message, { status: 400 });
  }

  try {
    const textStream = await resolvePredictorStream(messages);

    return new Response(textStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[laboratorio/predict]", error);
    return new Response("No se pudo generar la prediccion.", { status: 502 });
  }
}
