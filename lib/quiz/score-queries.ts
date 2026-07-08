import { createClient } from "@/lib/supabase/server";

export type QuizFinalRankingScoreRow = {
  poolId: string;
  profileId: string;
  quizTotalScore: number;
  finalPosition: number | null;
  bonusPoints: number;
  calculatedAt: string;
};

type ScoreDbRow = {
  pool_id: string;
  profile_id: string;
  quiz_total_score: number;
  final_position: number | null;
  bonus_points: number;
  calculated_at: string;
};

function mapScoreRow(row: ScoreDbRow): QuizFinalRankingScoreRow {
  return {
    poolId: row.pool_id,
    profileId: row.profile_id,
    quizTotalScore: row.quiz_total_score ?? 0,
    finalPosition: row.final_position,
    bonusPoints: row.bonus_points ?? 0,
    calculatedAt: row.calculated_at,
  };
}

type QuizScoreRow = {
  profile_id: string;
  best_score: number;
};

export async function loadQuizFinalRankingBonusesByProfile(
  poolId: string
): Promise<Map<string, number>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quiz_final_ranking_scores")
    .select("pool_id, profile_id, quiz_total_score, final_position, bonus_points, calculated_at")
    .eq("pool_id", poolId);

  if (error) throw new Error(error.message);

  if (data && data.length > 0) {
    return new Map(
      data.map((row) => [
        row.profile_id as string,
        (row.bonus_points as number) ?? 0,
      ])
    );
  }

  const { data: quizzes, error: quizError } = await supabase
    .from("quizzes")
    .select("id")
    .eq("pool_id", poolId)
    .eq("kind", "official")
    .eq("scoring_mode", "competitive");

  if (quizError) throw new Error(quizError.message);
  if (!quizzes?.length) return new Map();

  const quizIds = quizzes.map((q) => q.id as string);
  const { data: scores, error: scoreError } = await supabase
    .from("quiz_leaderboard")
    .select("profile_id, best_score")
    .in("quiz_id", quizIds);

  if (scoreError) throw new Error(scoreError.message);

  const totalScores = new Map<string, number>();
  for (const row of (scores ?? []) as QuizScoreRow[]) {
    const profileId = row.profile_id;
    totalScores.set(profileId, (totalScores.get(profileId) ?? 0) + (row.best_score ?? 0));
  }

  const sorted = [...totalScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const bonuses = [5, 3, 2, 1];
  const bonusMap = new Map<string, number>();
  for (let i = 0; i < sorted.length; i++) {
    bonusMap.set(sorted[i][0], bonuses[i]);
  }

  return bonusMap;
}

export async function getQuizFinalRankingScoreForProfile(
  poolId: string,
  profileId: string
): Promise<QuizFinalRankingScoreRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quiz_final_ranking_scores")
    .select("pool_id, profile_id, quiz_total_score, final_position, bonus_points, calculated_at")
    .eq("pool_id", poolId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return mapScoreRow(data as ScoreDbRow);
}
