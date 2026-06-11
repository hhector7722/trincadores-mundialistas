/** Debe coincidir con `quiz_final_ranking_bonus_for_position()` en SQL. */
export const QUIZ_FINAL_RANKING_BONUS_BY_POSITION = [5, 3, 2, 1] as const;

export const QUIZ_FINAL_RANKING_TOP_N = QUIZ_FINAL_RANKING_BONUS_BY_POSITION.length;

export function quizFinalRankingBonusForPosition(position: number): number {
  if (position < 1 || position > QUIZ_FINAL_RANKING_TOP_N) return 0;
  return QUIZ_FINAL_RANKING_BONUS_BY_POSITION[position - 1] ?? 0;
}
