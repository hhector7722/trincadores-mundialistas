export type HighlightSourceCode =
  | "youtube_dazn_es"
  | "youtube_fifa"
  | "youtube_replay"
  | "youtube_rtve_teledeporte";

export const SOURCE_PRIORITY: Record<HighlightSourceCode, number> = {
  youtube_fifa: 4,
  youtube_replay: 3,
  youtube_rtve_teledeporte: 2,
  youtube_dazn_es: 1,
};

/** FIFA > Replay > Teledeporte > DAZN ES; misma fuente solo si la fecha de publicación es igual o posterior. */
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

export function hasLowerHighlightPriority(
  incomingSource: HighlightSourceCode,
  existingSource: HighlightSourceCode,
): boolean {
  return SOURCE_PRIORITY[incomingSource] < SOURCE_PRIORITY[existingSource];
}

export function highlightSourceLabel(source: HighlightSourceCode | null | undefined): string {
  if (source === "youtube_dazn_es") return "Resumen DAZN";
  if (source === "youtube_fifa") return "Resumen FIFA";
  if (source === "youtube_replay") return "Resumen Replay";
  if (source === "youtube_rtve_teledeporte") return "Resumen Teledeporte";
  return "Resumen del partido";
}
