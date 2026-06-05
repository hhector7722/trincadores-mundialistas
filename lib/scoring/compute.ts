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
 * Puntos exclusivos: 8 marcador exacto, 5 diferencia de goles, 3 signo (1X2).
 * Solo aplica la mayor categoría cumplida.
 */
export function computeMatchPoints(input: ScoreInput): 0 | 3 | 5 | 8 {
  const { predictedHome, predictedAway, resultHome, resultAway } = input;
  if (
    predictedHome === resultHome &&
    predictedAway === resultAway
  ) {
    return 8;
  }
  const predDiff = predictedHome - predictedAway;
  const resDiff = resultHome - resultAway;
  if (predDiff === resDiff) {
    return 5;
  }
  if (matchOutcome(predictedHome, predictedAway) === matchOutcome(resultHome, resultAway)) {
    return 3;
  }
  return 0;
}