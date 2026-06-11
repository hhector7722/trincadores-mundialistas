export function formatQuizScore(value: number, hasParticipated: boolean): string {
  if (!hasParticipated) return " ";
  return String(value);
}

export function formatQuizReliabilityPct(
  pct: number | null,
  hasParticipated: boolean
): string {
  if (!hasParticipated || pct === null) return " ";
  return `${pct}%`;
}
