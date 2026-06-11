/** Aciertos / máximo teórico en quizzes competitivos oficiales (mejor intento por día). */
export function computeQuizReliabilityPct(
  totalScore: number,
  totalMaxPoints: number
): number | null {
  if (totalMaxPoints <= 0) return null;
  const pct = Math.round((totalScore / totalMaxPoints) * 100);
  return Math.min(100, Math.max(0, pct));
}
