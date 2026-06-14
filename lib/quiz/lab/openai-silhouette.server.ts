import sharp from "sharp";
import type { WorldCupMoment } from "@/lib/quiz/world-cup-moments";

const DEFAULT_MODEL = process.env.OPENAI_LAB_IMAGE_MODEL?.trim() || "gpt-image-1";

type OpenAiImageEditResponse = {
  data?: Array<{ b64_json?: string }>;
  error?: { message?: string };
};

export function buildSilhouetteImagePrompt(moment: WorldCupMoment): string {
  const targetPlayer = moment.quiz.correct_option;
  const otherPlayers = moment.players.filter((name) => name !== targetPlayer);
  const rivals = moment.teams.join(" vs ");

  return [
    "Edit this real football photograph for a sports quiz.",
    `Scene: ${moment.label}. FIFA World Cup ${moment.year}. Match context: ${rivals}.`,
    `Keep the exact same camera angle, background, stadium, lighting, colors, and every other person unchanged.`,
    otherPlayers.length
      ? `These players must stay fully visible and recognizable: ${otherPlayers.join(", ")}.`
      : "All other visible people must stay fully visible and recognizable.",
    `Only transform the footballer "${targetPlayer}" into a completely black, opaque, featureless silhouette.`,
    "The silhouette must be solid pure black (#000000), with no face, no kit details, no skin tones, and no gradients inside the figure.",
    "The silhouette shape must still clearly read as a football player in the same pose and position.",
    "Do not add text, logos, watermarks, borders, or extra players.",
    "Photorealistic scene except for that one black silhouette player.",
  ].join(" ");
}

function getOpenAiApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY no configurada para generar siluetas.");
  }
  return apiKey;
}

async function prepareSourceForOpenAi(sourceAbsolutePath: string): Promise<Buffer> {
  return sharp(sourceAbsolutePath)
    .rotate()
    .resize(1536, 1024, { fit: "inside", withoutEnlargement: false })
    .jpeg({ quality: 92 })
    .toBuffer();
}

function decodeOpenAiImagePayload(payload: OpenAiImageEditResponse): Buffer {
  const encoded = payload.data?.[0]?.b64_json;
  if (!encoded) {
    const message = payload.error?.message ?? "OpenAI no devolvio imagen.";
    throw new Error(message);
  }

  const normalized = encoded.startsWith("data:") ? encoded.split(",").pop() ?? "" : encoded;
  if (!normalized) {
    throw new Error("Respuesta de imagen vacia de OpenAI.");
  }

  return Buffer.from(normalized, "base64");
}

export async function generateSilhouetteWithOpenAi(
  sourceAbsolutePath: string,
  moment: WorldCupMoment
): Promise<Buffer> {
  const apiKey = getOpenAiApiKey();
  const sourceBuffer = await prepareSourceForOpenAi(sourceAbsolutePath);
  const prompt = buildSilhouetteImagePrompt(moment);

  const form = new FormData();
  form.append("model", DEFAULT_MODEL);
  form.append("prompt", prompt);
  form.append("image", new Blob([new Uint8Array(sourceBuffer)], { type: "image/jpeg" }), "source.jpg");
  form.append("size", "1536x1024");
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

export function isOpenAiSilhouetteEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
