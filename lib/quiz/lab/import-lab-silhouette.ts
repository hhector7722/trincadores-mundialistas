import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { persistedDerivedAssetAbsolutePath } from "@/lib/quiz/lab/derive-images.server";
import { getWorldCupMomentsCatalog } from "@/lib/quiz/world-cup-moments-catalog";
import { pickMomentById } from "@/lib/quiz/world-cup-moments";

export const DEFAULT_SILUETAS_DIR = "siluetas";

/** Acepta `wc2014-james-volley` o el nombre de archivo `wc2014-james-volley-silhouette.jpg`. */
export function normalizeLabSilhouetteMomentId(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.replace(/-silhouette\.jpe?g$/i, "");
}

export function expectedSilhouetteFileName(momentId: string): string {
  return `${normalizeLabSilhouetteMomentId(momentId)}-silhouette.jpg`;
}

export function expectedSilhouetteDownloadPath(
  momentId: string,
  fromDir = DEFAULT_SILUETAS_DIR
): string {
  return resolve(process.cwd(), fromDir, expectedSilhouetteFileName(momentId));
}

export function importLabSilhouetteFile(momentId: string, fromPath: string): string {
  const normalizedId = normalizeLabSilhouetteMomentId(momentId);
  const catalog = getWorldCupMomentsCatalog();
  const moment = pickMomentById(catalog, normalizedId, { readyOnly: true });
  if (!moment) {
    throw new Error(
      `Momento no encontrado: "${rawMomentIdLabel(momentId)}". Usa el ID del catálogo, ej. wc2014-james-volley (sin -silhouette.jpg).`
    );
  }

  const source = resolve(fromPath);
  if (!existsSync(source)) {
    throw new Error(`Archivo no encontrado: ${source}`);
  }

  const target = persistedDerivedAssetAbsolutePath(normalizedId, "silhouette");
  mkdirSync(resolve(target, ".."), { recursive: true });
  copyFileSync(source, target);

  return `/images/quiz/lab/generated/${expectedSilhouetteFileName(normalizedId)}`;
}

function rawMomentIdLabel(momentId: string): string {
  return momentId.trim();
}
