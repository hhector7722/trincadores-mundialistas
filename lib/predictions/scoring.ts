import type { ScoreOutcome } from "@/lib/predictions/prediction-outcome";

/** Debe coincidir con `match_*_points()` y `mvp_prediction_points()` en SQL. */
export const MATCH_SCORE_POINTS = {
  exact: 5,
  sign: 2,
  miss: 0,
} as const;

/** Puntos por acertar el MVP del partido (independiente del marcador). */
export const MVP_PREDICTION_POINTS = 1;

export function formatMvpPointsLabel(): string {
  return `+${MVP_PREDICTION_POINTS} pt`;
}

/** Suma marcador + MVP para la columna de aciertos del modal de pronósticos. */
export function computeBoardRowTotalPoints(
  scoreOutcome: ScoreOutcome | null,
  mvpCorrect: boolean,
  isKnockout: boolean = false
): number {
  let total = 0;
  
  if (isKnockout) {
    if (scoreOutcome === "exact_and_advancing") total += 5;
    else if (scoreOutcome === "exact") total += 3;
    else if (scoreOutcome === "advancing") total += 2;
  } else {
    if (scoreOutcome === "exact") total += MATCH_SCORE_POINTS.exact;
    else if (scoreOutcome === "sign") total += MATCH_SCORE_POINTS.sign;
  }

  if (mvpCorrect) total += MVP_PREDICTION_POINTS;
  return total;
}
