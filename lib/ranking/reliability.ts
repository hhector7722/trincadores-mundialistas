export const MAX_POINTS_PER_MATCH = 8;

/** Puntos conseguidos / maximo teorico en partidos ya resueltos. */
export function computeReliabilityPct(
  resolvedCount: number,
  totalPoints: number
): number | null {
  if (resolvedCount <= 0) return null;
  const pct = Math.round((totalPoints / (resolvedCount * MAX_POINTS_PER_MATCH)) * 100);
  return Math.min(100, Math.max(0, pct));
}

export function formatReliabilityPct(pct: number | null): string {
  if (pct === null || pct === 0) return " ";
  return `${pct}%`;
}
