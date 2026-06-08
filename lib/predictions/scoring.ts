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
