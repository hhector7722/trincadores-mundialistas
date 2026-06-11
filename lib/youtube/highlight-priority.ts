export type HighlightSourceCode = "youtube_fifa" | "youtube_rtve_teledeporte";

const SOURCE_PRIORITY: Record<HighlightSourceCode, number> = {
  youtube_fifa: 2,
  youtube_rtve_teledeporte: 1,
};

/** FIFA sustituye Teledeporte; misma fuente solo si la fecha de publicación es igual o posterior. */
export function shouldReplaceMatchHighlight(
  existingSource: HighlightSourceCode | null,
  existingPublishedAt: string | null,
  incomingSource: HighlightSourceCode,
  incomingPublishedAt: string,
): boolean {
  if (!existingSource) return true;

  const existingPriority = SOURCE_PRIORITY[existingSource];
  const incomingPriority = SOURCE_PRIORITY[incomingSource];

  if (incomingPriority > existingPriority) return true;
  if (incomingPriority < existingPriority) return false;

  if (!existingPublishedAt) return true;
  return new Date(incomingPublishedAt).getTime() >= new Date(existingPublishedAt).getTime();
}

export function highlightSourceLabel(source: HighlightSourceCode | null | undefined): string {
  if (source === "youtube_fifa") return "Resumen FIFA";
  if (source === "youtube_rtve_teledeporte") return "Resumen Teledeporte";
  return "Resumen del partido";
}
