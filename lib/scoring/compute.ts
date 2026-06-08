import { MATCH_SCORE_POINTS } from "@/lib/predictions/scoring";

export type ScoreInput = {
  predictedHome: number;
  predictedAway: number;
  resultHome: number;
  resultAway: number;
};

/** Resultado 1X2: 1 = local, 0 = empate, -1 = visitante */
export function matchOutcome(home: number, away: number): -1 | 0 | 1 {
  if (home > away) return 1;
  if (home < away) return -1;
  return 0;
}

/**
 * Puntos exclusivos: 5 marcador exacto, 2 signo (1X2).
 * El exacto ya incluye el signo; no se suman ambos.
 */
export function computeMatchPoints(input: ScoreInput): 0 | 2 | 5 {
  const { predictedHome, predictedAway, resultHome, resultAway } = input;
  if (predictedHome === resultHome && predictedAway === resultAway) {
    return MATCH_SCORE_POINTS.exact;
  }
  if (matchOutcome(predictedHome, predictedAway) === matchOutcome(resultHome, resultAway)) {
    return MATCH_SCORE_POINTS.sign;
  }
  return MATCH_SCORE_POINTS.miss;
}
