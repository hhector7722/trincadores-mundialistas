import { createAdminClient } from "@/lib/supabase/admin";

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

/** Bonus persistido del ranking quiz (top 4). No recalcula en vivo. */
export async function loadQuizFinalRankingBonusesByProfile(
  poolId: string
): Promise<Map<string, number>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("quiz_final_ranking_scores")
    .select("pool_id, profile_id, quiz_total_score, final_position, bonus_points, calculated_at")
    .eq("pool_id", poolId);

  if (error) throw new Error(error.message);

  return new Map(
    (data ?? []).map((row) => [
      row.profile_id as string,
      (row.bonus_points as number) ?? 0,
    ])
  );
}

export async function getQuizFinalRankingScoreForProfile(
  poolId: string,
  profileId: string
): Promise<QuizFinalRankingScoreRow | null> {
  const supabase = createAdminClient();
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
