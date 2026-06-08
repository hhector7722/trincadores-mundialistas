import { createClient } from "@/lib/supabase/server";
import type { TournamentOfficialAwardsInput } from "@/lib/tournament-predictions/scoring";

export type TournamentOfficialAwards = TournamentOfficialAwardsInput & {
  poolId: string;
  recordedAt: string | null;
  updatedAt: string | null;
};

type AwardsDbRow = {
  pool_id: string;
  champion_team: string | null;
  finalist_team_a: string | null;
  finalist_team_b: string | null;
  top_scorer_player_name: string | null;
  top_scorer_team_name: string | null;
  tournament_mvp_player_name: string | null;
  tournament_mvp_team_name: string | null;
  golden_glove_player_name: string | null;
  golden_glove_team_name: string | null;
  recorded_at: string | null;
  updated_at: string | null;
};

function mapAwardsRow(row: AwardsDbRow): TournamentOfficialAwards {
  return {
    poolId: row.pool_id,
    championTeam: row.champion_team,
    finalistTeamA: row.finalist_team_a,
    finalistTeamB: row.finalist_team_b,
    topScorerPlayerName: row.top_scorer_player_name,
    topScorerTeamName: row.top_scorer_team_name,
    tournamentMvpPlayerName: row.tournament_mvp_player_name,
    tournamentMvpTeamName: row.tournament_mvp_team_name,
    goldenGlovePlayerName: row.golden_glove_player_name,
    goldenGloveTeamName: row.golden_glove_team_name,
    recordedAt: row.recorded_at,
    updatedAt: row.updated_at,
  };
}

export async function getTournamentOfficialAwards(
  poolId: string
): Promise<TournamentOfficialAwards | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_official_awards")
    .select(
      "pool_id, champion_team, finalist_team_a, finalist_team_b, top_scorer_player_name, top_scorer_team_name, tournament_mvp_player_name, tournament_mvp_team_name, golden_glove_player_name, golden_glove_team_name, recorded_at, updated_at"
    )
    .eq("pool_id", poolId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return mapAwardsRow(data as AwardsDbRow);
}
