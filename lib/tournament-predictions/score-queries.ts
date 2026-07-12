import { createAdminClient } from "@/lib/supabase/admin";
import type { TournamentGeneralScoreBreakdown } from "@/lib/tournament-predictions/scoring";

export type TournamentGeneralPredictionScoreRow = TournamentGeneralScoreBreakdown & {
  poolId: string;
  profileId: string;
  calculatedAt: string;
};

type ScoreDbRow = {
  pool_id: string;
  profile_id: string;
  champion_points: number;
  finalists_points: number;
  top_scorer_points: number;
  tournament_mvp_points: number;
  golden_glove_points: number;
  total_points: number;
  calculated_at: string;
};

function mapScoreRow(row: ScoreDbRow): TournamentGeneralPredictionScoreRow {
  return {
    poolId: row.pool_id,
    profileId: row.profile_id,
    championPoints: row.champion_points ?? 0,
    finalistsPoints: row.finalists_points ?? 0,
    topScorerPoints: row.top_scorer_points ?? 0,
    tournamentMvpPoints: row.tournament_mvp_points ?? 0,
    goldenGlovePoints: row.golden_glove_points ?? 0,
    totalPoints: row.total_points ?? 0,
    calculatedAt: row.calculated_at,
  };
}

export async function loadTournamentGeneralScoresByProfile(
  poolId: string
): Promise<Map<string, TournamentGeneralPredictionScoreRow>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tournament_general_prediction_scores")
    .select(
      "pool_id, profile_id, champion_points, finalists_points, top_scorer_points, tournament_mvp_points, golden_glove_points, total_points, calculated_at"
    )
    .eq("pool_id", poolId);

  if (error) throw new Error(error.message);

  return new Map(
    (data ?? []).map((row) => [
      row.profile_id as string,
      mapScoreRow(row as ScoreDbRow),
    ])
  );
}

export async function getTournamentGeneralScoreForProfile(
  poolId: string,
  profileId: string
): Promise<TournamentGeneralPredictionScoreRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tournament_general_prediction_scores")
    .select(
      "pool_id, profile_id, champion_points, finalists_points, top_scorer_points, tournament_mvp_points, golden_glove_points, total_points, calculated_at"
    )
    .eq("pool_id", poolId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return mapScoreRow(data as ScoreDbRow);
}
