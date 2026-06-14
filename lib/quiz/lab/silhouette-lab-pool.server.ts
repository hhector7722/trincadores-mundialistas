import { accessSync } from "node:fs";
import { join } from "node:path";
import {
  SILHOUETTE_LAB_MOMENT_IDS,
  type SilhouetteLabMomentId,
} from "@/lib/quiz/lab/silhouette-lab-pool";

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
