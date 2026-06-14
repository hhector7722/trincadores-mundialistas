import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import {
  generateSilhouetteWithOpenAi,
  isOpenAiSilhouetteEnabled,
} from "@/lib/quiz/lab/openai-silhouette.server";
import type { WorldCupMoment } from "@/lib/quiz/world-cup-moments";

export type LabDeriveVariant = "hair" | "eyes" | "silhouette";

const GENERATED_REL_DIR = "images/quiz/lab/generated";

const assetCache = new Map<string, Buffer>();

export type DerivedAssetOptions = {
  moment?: WorldCupMoment;
  force?: boolean;
};

export function labGeneratedAssetApiUrl(
  momentId: string,
  variant: LabDeriveVariant,
  force = false
): string {
  const params = new URLSearchParams({ momentId, variant });
  if (force) params.set("force", "1");
  return `/api/laboratorio/asset?${params.toString()}`;
}

function silhouetteFocusX(momentId: string): number {
  const hash = momentId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return [0.3, 0.5, 0.68][hash % 3] ?? 0.5;
}

function buildSilhouetteSvg(figureW: number, figureH: number): Buffer {
  const headRx = figureW * 0.34;
  const headRy = figureH * 0.09;
  const headCy = figureH * 0.11;
  const bodyX = figureW * 0.22;
  const bodyY = figureH * 0.19;
  const bodyW = figureW * 0.56;
  const bodyH = figureH * 0.52;
  const legRx = figureW * 0.13;
  const legRy = figureH * 0.11;

  const svg = `<svg width="${figureW}" height="${figureH}" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="${figureW / 2}" cy="${headCy}" rx="${headRx}" ry="${headRy}" fill="#000"/>
    <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="10" fill="#000"/>
    <ellipse cx="${figureW * 0.34}" cy="${figureH * 0.86}" rx="${legRx}" ry="${legRy}" fill="#000"/>
    <ellipse cx="${figureW * 0.66}" cy="${figureH * 0.86}" rx="${legRx}" ry="${legRy}" fill="#000"/>
  </svg>`;

  return Buffer.from(svg);
}

async function renderSilhouetteFallback(
  sourceAbsolutePath: string,
  momentId: string
): Promise<Buffer> {
  const meta = await sharp(sourceAbsolutePath).metadata();
  const width = meta.width ?? 1200;
  const height = meta.height ?? 800;
  const focusX = silhouetteFocusX(momentId);
  const figureW = Math.max(40, Math.round(width * 0.19));
  const figureH = Math.max(80, Math.round(height * 0.8));
  const left = Math.min(
    Math.max(0, Math.round(width * focusX - figureW / 2)),
    width - figureW
  );
  const top = Math.max(0, Math.round(height * 0.1));

  return sharp(sourceAbsolutePath)
    .composite([{ input: buildSilhouetteSvg(figureW, figureH), left, top }])
    .jpeg({ quality: 88 })
    .toBuffer();
}

async function renderSilhouetteBuffer(
  sourceAbsolutePath: string,
  momentId: string,
  moment?: WorldCupMoment
): Promise<Buffer> {
  if (moment && isOpenAiSilhouetteEnabled()) {
    return generateSilhouetteWithOpenAi(sourceAbsolutePath, moment);
  }

  if (moment && !isOpenAiSilhouetteEnabled()) {
    throw new Error("OPENAI_API_KEY no configurada para generar siluetas.");
  }

  return renderSilhouetteFallback(sourceAbsolutePath, momentId);
}

async function renderDerivedBuffer(
  sourceAbsolutePath: string,
  momentId: string,
  variant: LabDeriveVariant,
  opts?: DerivedAssetOptions
): Promise<Buffer> {
  const meta = await sharp(sourceAbsolutePath).metadata();
  const width = meta.width ?? 1200;
  const height = meta.height ?? 800;

  if (variant === "hair") {
    const cropW = Math.max(1, Math.round(width * 0.52));
    const cropH = Math.max(1, Math.round(height * 0.2));
    const left = Math.max(0, Math.round((width - cropW) / 2));
    return sharp(sourceAbsolutePath)
      .extract({ left, top: 0, width: cropW, height: cropH })
      .resize(960, 540, { fit: "cover", position: "top" })
      .jpeg({ quality: 88 })
      .toBuffer();
  }

  if (variant === "eyes") {
    const cropW = Math.max(1, Math.round(width * 0.42));
    const cropH = Math.max(1, Math.round(height * 0.12));
    const left = Math.max(0, Math.round((width - cropW) / 2));
    const top = Math.max(0, Math.round(height * 0.27));
    return sharp(sourceAbsolutePath)
      .extract({ left, top, width: cropW, height: cropH })
      .resize(960, 320, { fit: "cover" })
      .jpeg({ quality: 88 })
      .toBuffer();
  }

  return renderSilhouetteBuffer(sourceAbsolutePath, momentId, opts?.moment);
}

export function momentSourceAbsolutePath(localPath: string): string {
  return join(process.cwd(), "public", localPath.replace(/^\//, ""));
}

export async function getDerivedLabAssetBuffer(
  sourceAbsolutePath: string,
  momentId: string,
  variant: LabDeriveVariant,
  opts?: DerivedAssetOptions
): Promise<Buffer> {
  const cacheKey = `${momentId}:${variant}`;
  if (opts?.force) {
    assetCache.delete(cacheKey);
  }

  const cached = assetCache.get(cacheKey);
  if (cached) return cached;

  const buffer = await renderDerivedBuffer(sourceAbsolutePath, momentId, variant, opts);
  assetCache.set(cacheKey, buffer);
  return buffer;
}

export function persistedDerivedAssetFileName(
  momentId: string,
  variant: LabDeriveVariant
): string {
  return `${momentId}-${variant}.jpg`;
}

export function persistedDerivedAssetPublicUrl(
  momentId: string,
  variant: LabDeriveVariant
): string {
  return `/${GENERATED_REL_DIR}/${persistedDerivedAssetFileName(momentId, variant)}`;
}

export function persistedDerivedAssetAbsolutePath(
  momentId: string,
  variant: LabDeriveVariant
): string {
  return join(
    process.cwd(),
    "public",
    GENERATED_REL_DIR,
    persistedDerivedAssetFileName(momentId, variant)
  );
}

export async function persistDerivedAssetToDisk(
  momentId: string,
  variant: LabDeriveVariant,
  buffer: Buffer
): Promise<string> {
  const dir = join(process.cwd(), "public", GENERATED_REL_DIR);
  await mkdir(dir, { recursive: true });
  const filePath = persistedDerivedAssetAbsolutePath(momentId, variant);
  await writeFile(filePath, buffer);
  return persistedDerivedAssetPublicUrl(momentId, variant);
}

export async function tryReadPersistedDerivedAsset(
  momentId: string,
  variant: LabDeriveVariant
): Promise<Buffer | null> {
  try {
    const filePath = persistedDerivedAssetAbsolutePath(momentId, variant);
    await access(filePath);
    return sharp(filePath).jpeg().toBuffer();
  } catch {
    return null;
  }
}

export function isDerivedLabImageUrl(imageUrl: string): boolean {
  return (
    imageUrl.includes("/api/laboratorio/asset") ||
    imageUrl.includes(`/${GENERATED_REL_DIR}/`)
  );
}
