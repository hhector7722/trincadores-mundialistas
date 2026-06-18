import { MATCH_SCORE_POINTS } from "@/lib/predictions/scoring";

/** Techo de puntos por marcador resuelto (exacto = 5). */
export const MAX_POINTS_PER_MATCH = MATCH_SCORE_POINTS.exact;

/** Prior comunitario cuando hay menos de 5 usuarios con predicciones resueltas. */
export const DEFAULT_COMMUNITY_AVG = 0.35;

/** Peso del prior bayesiano frente a los datos propios del usuario. */
export const BAYESIAN_WEIGHT_M = 7;

const MIN_USERS_FOR_COMMUNITY_AVG = 5;

export type ReliabilityStats = {
  resolvedCount: number;
  totalPoints: number;
};

export function computeRawReliabilityPct(
  resolvedCount: number,
  totalPoints: number
): number | null {
  if (resolvedCount <= 0) return null;
  return totalPoints / (resolvedCount * MAX_POINTS_PER_MATCH);
}

/** Promedio de rawPct por perfil; leave-one-out opcional para consultas individuales. */
export function computeCommunityAvgFromStats(
  stats: Map<string, ReliabilityStats>,
  excludeProfileId?: string
): number {
  const rawPcts: number[] = [];

  for (const [profileId, row] of stats) {
    if (excludeProfileId && profileId === excludeProfileId) continue;
    if (row.resolvedCount < 1) continue;
    const raw = computeRawReliabilityPct(row.resolvedCount, row.totalPoints);
    if (raw !== null) rawPcts.push(raw);
  }

  if (rawPcts.length < MIN_USERS_FOR_COMMUNITY_AVG) {
    return DEFAULT_COMMUNITY_AVG;
  }

  return rawPcts.reduce((sum, value) => sum + value, 0) / rawPcts.length;
}

export function computeReliabilityPct(
  resolvedCount: number,
  totalPoints: number,
  communityAvg: number
): number | null {
  if (resolvedCount <= 0) return null;

  const rawPct = computeRawReliabilityPct(resolvedCount, totalPoints)!;
  const n = resolvedCount;
  const m = BAYESIAN_WEIGHT_M;
  const smoothed = (n / (n + m)) * rawPct + (m / (n + m)) * communityAvg;
  const pct = Math.round(100 * smoothed);
  return Math.min(100, Math.max(0, pct));
}

export function formatReliabilityPct(pct: number | null): string {
  if (pct === null || pct === 0) return " ";
  return `${pct}%`;
}
