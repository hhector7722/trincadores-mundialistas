export type LabAssetVariant = "hair" | "eyes" | "silhouette";

/** URL del asset derivado (segura en cliente y servidor). */
export function labGeneratedAssetApiUrl(
  momentId: string,
  variant: LabAssetVariant,
  force = false
): string {
  const params = new URLSearchParams({ momentId, variant });
  if (force) params.set("force", "1");
  return `/api/laboratorio/asset?${params.toString()}`;
}
