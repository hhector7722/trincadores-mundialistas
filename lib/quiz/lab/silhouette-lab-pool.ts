import { accessSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

/** Momentos fáciles para silueta en el laboratorio (sin Martínez: demasiado obvio). */
export const SILHOUETTE_LAB_MOMENT_IDS = [
  "wc1997-roberto-carlos-freekick",
  "wc2014-van-persie-flying-header",
  "wc2010-spain-xi-silhouette",
  "wc2014-james-volley",
  "wc1998-zidane-final",
  "wc1994-baggio-penalty",
  "wc1990-schillaci-celebration",
  "wc1994-bebeto-celebration",
  "wc1978-kempes-celebration",
  "wc1982-tardelli-goal",
] as const;

export type SilhouetteLabMomentId = (typeof SILHOUETTE_LAB_MOMENT_IDS)[number];

export const SILHOUETTE_LAB_MOMENT_ID_SET = new Set<string>(SILHOUETTE_LAB_MOMENT_IDS);

export function materializedSilhouetteAbsolutePath(momentId: string): string {
  return join(
    process.cwd(),
    "public",
    "images/quiz/lab/generated",
    `${momentId}-silhouette.jpg`
  );
}

export function hasMaterializedSilhouette(momentId: string): boolean {
  try {
    accessSync(materializedSilhouetteAbsolutePath(momentId));
    return true;
  } catch {
    return false;
  }
}

export function listSilhouetteLabMomentsWithAsset(): SilhouetteLabMomentId[] {
  return SILHOUETTE_LAB_MOMENT_IDS.filter((id) => hasMaterializedSilhouette(id));
}
