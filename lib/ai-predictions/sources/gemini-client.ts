const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export function getGeminiApiKey(): string | null {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GOOGLE_AI_API_KEY?.trim() ||
    null
  );
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export function resolveGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
};

export async function geminiGenerateJson<T>(input: {
  systemInstruction: string;
  userPrompt: string;
  useGoogleSearch?: boolean;
}): Promise<T> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no configurada.");
  }

  const model = resolveGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body: Record<string, unknown> = {
    systemInstruction: {
      parts: [{ text: input.systemInstruction }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: input.userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.35,
    },
  };

  if (input.useGoogleSearch) {
    body.tools = [{ google_search: {} }];
  } else {
    (body.generationConfig as Record<string, unknown>).responseMimeType = "application/json";
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as GeminiGenerateResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Gemini HTTP ${response.status}`);
  }

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error("Gemini devolvio una respuesta vacia.");
  }

  return parseJsonPayload<T>(text);
}

function parseJsonPayload<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error("JSON invalido en respuesta Gemini.");
  }
}
