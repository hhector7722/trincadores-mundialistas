import {
  MATCH_SCORE_POINTS,
  MVP_PREDICTION_POINTS,
} from "@/lib/predictions/scoring";

/** Peso del acierto de signo (1X2) en la Fiab por partido. */
export const RELIABILITY_SIGN_WEIGHT = 0.7;

/** Plus por marcador exacto (solo si ya hay signo acertado). */
export const RELIABILITY_EXACT_BONUS = 0.3;

/** Plus por MVP acertado (independiente del marcador, tope 100% por partido). */
export const RELIABILITY_MVP_BONUS = 0.05;

/**
 * Prior comunitario (escala 0–1) cuando hay menos de 5 perfiles con pronósticos resueltos.
 * Aprox. un jugador medio con ~50% signos y algún exacto/MVP.
 */
export const DEFAULT_COMMUNITY_AVG = 0.48;

/** Peso del prior bayesiano frente a los datos propios del usuario. */
export const BAYESIAN_WEIGHT_M = 7;

const MIN_USERS_FOR_COMMUNITY_AVG = 5;

export type ReliabilityStats = {
  resolvedCount: number;
  /** Suma de unidades 0–1 por partido pronosticado y resuelto. */
  totalUnitSum: number;
};

export function createEmptyReliabilityStats(): ReliabilityStats {
  return { resolvedCount: 0, totalUnitSum: 0 };
}

/** Unidad 0–1 de Fiab para un partido con marcador resuelto (+ MVP opcional). */
export function computeMatchReliabilityUnit(
  scorePointsAwarded: number,
  mvpPointsAwarded: number | null | undefined
): number {
  let unit = 0;

  if (scorePointsAwarded === MATCH_SCORE_POINTS.exact) {
    unit = RELIABILITY_SIGN_WEIGHT + RELIABILITY_EXACT_BONUS;
  } else if (scorePointsAwarded === MATCH_SCORE_POINTS.sign) {
    unit = RELIABILITY_SIGN_WEIGHT;
  }

  const mvpCorrect =
    mvpPointsAwarded != null && mvpPointsAwarded >= MVP_PREDICTION_POINTS;
  if (mvpCorrect) {
    unit += RELIABILITY_MVP_BONUS;
  }

  return Math.min(1, unit);
}

export function addResolvedMatchToReliabilityStats(
  stats: ReliabilityStats,
  scorePointsAwarded: number,
  mvpPointsAwarded: number | null | undefined
): ReliabilityStats {
  return {
    resolvedCount: stats.resolvedCount + 1,
    totalUnitSum:
      stats.totalUnitSum +
      computeMatchReliabilityUnit(scorePointsAwarded, mvpPointsAwarded),
  };
}

export function computeRawReliabilityPct(
  resolvedCount: number,
  totalUnitSum: number
): number | null {
  if (resolvedCount <= 0) return null;
  return totalUnitSum / resolvedCount;
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
    const raw = computeRawReliabilityPct(row.resolvedCount, row.totalUnitSum);
    if (raw !== null) rawPcts.push(raw);
  }

  if (rawPcts.length < MIN_USERS_FOR_COMMUNITY_AVG) {
    return DEFAULT_COMMUNITY_AVG;
  }

  return rawPcts.reduce((sum, value) => sum + value, 0) / rawPcts.length;
}

export function computeReliabilityPct(
  resolvedCount: number,
  totalUnitSum: number,
  communityAvg: number
): number | null {
  if (resolvedCount <= 0) return null;

  const rawPct = computeRawReliabilityPct(resolvedCount, totalUnitSum)!;
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
