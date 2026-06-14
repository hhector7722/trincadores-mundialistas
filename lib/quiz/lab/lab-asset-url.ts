export type LabAssetVariant = "hair" | "eyes" | "silhouette";

const GENERATED_REL_DIR = "images/quiz/lab/generated";

export function persistedLabAssetFileName(
  momentId: string,
  variant: LabAssetVariant
): string {
  return `${momentId}-${variant}.jpg`;
}

/** URL estática del asset materializado (fuente de verdad en prod). */
export function resolveLabAssetUrl(momentId: string, variant: LabAssetVariant): string {
  return `/${GENERATED_REL_DIR}/${persistedLabAssetFileName(momentId, variant)}`;
}

/** URL del asset derivado vía API (solo dev / regeneración). */
export function labGeneratedAssetApiUrl(
  momentId: string,
  variant: LabAssetVariant,
  force = false
): string {
  const params = new URLSearchParams({ momentId, variant });
  if (force) params.set("force", "1");
  return `/api/laboratorio/asset?${params.toString()}`;
}

export function isStaticLabGeneratedAssetUrl(imageUrl: string): boolean {
  return imageUrl.includes(`/${GENERATED_REL_DIR}/`);
}
