import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export function readScriptArg(argv: string[], flag: string): string | null {
  const inline = argv.find((arg) => arg.startsWith(`${flag}=`));
  if (inline) return inline.slice(flag.length + 1).trim() || null;
  const index = argv.indexOf(flag);
  if (index >= 0 && argv[index + 1]) return argv[index + 1].trim();
  return null;
}

export function guessImageExtension(contentType: string | null, url: string): string {
  const lower = (contentType ?? "").toLowerCase();
  if (lower.includes("png")) return ".png";
  if (lower.includes("webp")) return ".webp";
  if (lower.includes("jpeg") || lower.includes("jpg")) return ".jpg";
  const pathPart = url.split("?")[0] ?? "";
  const match = pathPart.match(/\.(jpe?g|png|webp)$/i);
  return match ? match[0].toLowerCase() : ".jpg";
}

export async function downloadMomentImage(url: string): Promise<{ bytes: Buffer; contentType: string | null }> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "TrincadoresMundialistas/1.0 (quiz image import; private pool)",
      Accept: "image/*",
      Referer: new URL(url).origin,
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} al descargar ${url}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && !contentType.startsWith("image/")) {
    throw new Error(`URL no es imagen (${contentType}): ${url}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1024) {
    throw new Error(`Respuesta demasiado pequeña (${bytes.length} bytes); ¿URL correcta?`);
  }
  return { bytes, contentType };
}

export function saveMomentImageFile(
  absolutePath: string,
  bytes: Buffer
): void {
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, bytes);
}
