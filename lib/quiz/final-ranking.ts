import { quizFinalRankingBonusForPosition, QUIZ_FINAL_RANKING_TOP_N } from "@/lib/quiz/scoring";

export type QuizFinalRankingInput = {
  profileId: string;
  totalScore: number;
};

export type QuizFinalRankingBonus = {
  position: number;
  bonusPoints: number;
};

/** Clasificación final del quiz con bonus para el top 5 (empates comparten posición). */
export function computeQuizFinalRankingBonuses(
  rows: QuizFinalRankingInput[]
): Map<string, QuizFinalRankingBonus> {
  const sorted = [...rows].sort(
    (a, b) => b.totalScore - a.totalScore || a.profileId.localeCompare(b.profileId)
  );

  const result = new Map<string, QuizFinalRankingBonus>();
  let position = 0;
  let lastScore: number | null = null;

  for (let index = 0; index < sorted.length; index++) {
    const row = sorted[index]!;
    if (lastScore === null || row.totalScore < lastScore) {
      position = index + 1;
      lastScore = row.totalScore;
    }
    if (position > QUIZ_FINAL_RANKING_TOP_N) break;

    const bonusPoints = quizFinalRankingBonusForPosition(position);
    if (bonusPoints > 0) {
      result.set(row.profileId, { position, bonusPoints });
    }
  }

  return result;
}
