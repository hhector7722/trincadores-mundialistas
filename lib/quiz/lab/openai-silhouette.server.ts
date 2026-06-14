import sharp from "sharp";
import type { WorldCupMoment } from "@/lib/quiz/world-cup-moments";

const DEFAULT_MODEL = process.env.OPENAI_LAB_IMAGE_MODEL?.trim() || "gpt-image-1";
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 4_000;

type OpenAiImageEditResponse = {
  data?: Array<{ b64_json?: string }>;
  error?: { message?: string };
};

type OpenAiImageSize = "1024x1024" | "1536x1024" | "1024x1536";

/** Prompt base alineado con el flujo manual en ChatGPT (imagen + jugador objetivo). */
export function buildSilhouetteImagePrompt(moment: WorldCupMoment): string {
  const targetPlayer = moment.quiz.correct_option;
  const otherPlayers = moment.players.filter((name) => name !== targetPlayer);

  return [
    "Transform the uploaded football match photo into a 'guess the player' silhouette challenge.",
    `Replace exactly one football player — "${targetPlayer}" — with a pure black silhouette.`,
    "The silhouette must be 100% opaque and completely featureless.",
    "No face, eyes, hair, skin, jersey details, shirt number, sponsor, logo, boots, shadows, highlights, textures, wrinkles, reflections, gradients, transparency, or visible internal contours.",
    "The player must appear as a single solid black shape (#000000) while preserving the exact pose, body proportions, and position from the original image.",
    "Keep the ball, pitch, stadium, crowd, lighting, colors, perspective, and all other players completely unchanged.",
    otherPlayers.length
      ? `These other players must remain fully visible and unchanged: ${otherPlayers.join(", ")}.`
      : "All other visible people must remain fully visible and unchanged.",
    "Do not crop, resize, or alter the composition.",
    "The final image should look identical to the original photograph except that the selected player has been replaced by a perfectly solid black silhouette.",
    "High-quality realistic sports photography.",
  ].join(" ");
}

function getOpenAiApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY no configurada para generar siluetas.");
  }
  return apiKey;
}

function pickOpenAiImageSize(width: number, height: number): OpenAiImageSize {
  const ratio = width / height;
  if (ratio > 1.15) return "1536x1024";
  if (ratio < 0.87) return "1024x1536";
  return "1024x1024";
}

async function prepareSourceForOpenAi(
  sourceAbsolutePath: string
): Promise<{ buffer: Buffer; size: OpenAiImageSize }> {
  const meta = await sharp(sourceAbsolutePath).rotate().metadata();
  const width = meta.width ?? 1200;
  const height = meta.height ?? 800;
  const size = pickOpenAiImageSize(width, height);
  const [targetW, targetH] = size.split("x").map((value) => Number(value));

  const buffer = await sharp(sourceAbsolutePath)
    .rotate()
    .resize(targetW, targetH, { fit: "inside", withoutEnlargement: false })
    .jpeg({ quality: 92 })
    .toBuffer();

  return { buffer, size };
}

function decodeOpenAiImagePayload(payload: OpenAiImageEditResponse): Buffer {
  const encoded = payload.data?.[0]?.b64_json;
  if (!encoded) {
    const message = payload.error?.message ?? "OpenAI no devolvió imagen.";
    throw new Error(message);
  }

  const normalized = encoded.startsWith("data:") ? encoded.split(",").pop() ?? "" : encoded;
  if (!normalized) {
    throw new Error("Respuesta de imagen vacía de OpenAI.");
  }

  return Buffer.from(normalized, "base64");
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestSilhouetteEdit(
  sourceBuffer: Buffer,
  prompt: string,
  size: OpenAiImageSize,
  apiKey: string
): Promise<Buffer> {
  const form = new FormData();
  form.append("model", DEFAULT_MODEL);
  form.append("prompt", prompt);
  form.append("image", new Blob([new Uint8Array(sourceBuffer)], { type: "image/jpeg" }), "source.jpg");
  form.append("size", size);
  form.append("quality", "high");
  form.append("input_fidelity", "high");
  form.append("output_format", "jpeg");
  form.append("output_compression", "90");
  form.append("n", "1");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  const payload = (await response.json().catch(() => null)) as OpenAiImageEditResponse | null;

  if (!response.ok || !payload) {
    const detail = payload?.error?.message ?? (await response.text().catch(() => ""));
    throw new Error(
      detail
        ? `OpenAI no pudo generar la silueta: ${detail}`
        : `OpenAI no pudo generar la silueta (${response.status}).`
    );
  }

  const generated = decodeOpenAiImagePayload(payload);
  return sharp(generated).jpeg({ quality: 90 }).toBuffer();
}

export async function generateSilhouetteWithOpenAi(
  sourceAbsolutePath: string,
  moment: WorldCupMoment
): Promise<Buffer> {
  const apiKey = getOpenAiApiKey();
  const { buffer: sourceBuffer, size } = await prepareSourceForOpenAi(sourceAbsolutePath);
  const prompt = buildSilhouetteImagePrompt(moment);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await requestSilhouetteEdit(sourceBuffer, prompt, size, apiKey);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_ATTEMPTS) {
        console.warn(
          `[openai-silhouette] Intento ${attempt}/${MAX_ATTEMPTS} fallido para ${moment.id}: ${lastError.message}`
        );
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError ?? new Error("OpenAI no pudo generar la silueta.");
}

export function isOpenAiSilhouetteEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
