/** Puntos por acertar el MVP del partido (debe coincidir con `mvp_prediction_points()` en SQL). */
export const MVP_PREDICTION_POINTS = 5;

export const MATCH_SCORE_POINTS = {
  exact: 8,
  goalDiff: 5,
  sign: 3,
  miss: 0,
} as const;

export function formatMvpPointsLabel(): string {
  return `+${MVP_PREDICTION_POINTS} pts`;
}
