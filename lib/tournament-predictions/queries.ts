import { isProfileOnboardingComplete } from "@/lib/auth/onboarding-device";
import { createClient } from "@/lib/supabase/server";
import type {
  TournamentGeneralPredictions,
  TournamentGeneralPredictionsBoardRow,
} from "@/lib/tournament-predictions/types";

type Row = {
  pool_id: string;
  profile_id: string;
  champion_team: string | null;
  finalist_team_a: string | null;
  finalist_team_b: string | null;
  top_scorer_player_name: string | null;
  top_scorer_team_name: string | null;
  tournament_mvp_player_name: string | null;
  tournament_mvp_team_name: string | null;
  golden_glove_player_name: string | null;
  golden_glove_team_name: string | null;
  updated_at: string;
};

function mapRow(row: Row): TournamentGeneralPredictions {
  return {
    poolId: row.pool_id,
    profileId: row.profile_id,
    championTeam: row.champion_team,
    finalistTeamA: row.finalist_team_a,
    finalistTeamB: row.finalist_team_b,
    topScorerPlayerName: row.top_scorer_player_name,
    topScorerTeamName: row.top_scorer_team_name,
    tournamentMvpPlayerName: row.tournament_mvp_player_name,
    tournamentMvpTeamName: row.tournament_mvp_team_name,
    goldenGlovePlayerName: row.golden_glove_player_name,
    goldenGloveTeamName: row.golden_glove_team_name,
    updatedAt: row.updated_at,
  };
}

const EMPTY_PREDICTIONS = (poolId: string, profileId: string): TournamentGeneralPredictions => ({
  poolId,
  profileId,
  championTeam: null,
  finalistTeamA: null,
  finalistTeamB: null,
  topScorerPlayerName: null,
  topScorerTeamName: null,
  tournamentMvpPlayerName: null,
  tournamentMvpTeamName: null,
  goldenGlovePlayerName: null,
  goldenGloveTeamName: null,
  updatedAt: null,
});

export async function fetchTournamentGeneralPredictionsEditable(
  poolId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("tournament_general_predictions_edit_allowed", {
    p_pool_id: poolId,
  });
  if (error) return false;
  return data === true;
}

export async function getTournamentGeneralPredictions(
  poolId: string,
  profileId: string
): Promise<{ predictions: TournamentGeneralPredictions; editable: boolean }> {
  const supabase = await createClient();

  const [editable, rowResult] = await Promise.all([
    fetchTournamentGeneralPredictionsEditable(poolId),
    supabase
      .from("tournament_general_predictions")
      .select(
        "pool_id, profile_id, champion_team, finalist_team_a, finalist_team_b, top_scorer_player_name, top_scorer_team_name, tournament_mvp_player_name, tournament_mvp_team_name, golden_glove_player_name, golden_glove_team_name, updated_at"
      )
      .eq("pool_id", poolId)
      .eq("profile_id", profileId)
      .maybeSingle(),
  ]);

  if (rowResult.error) {
    throw new Error(rowResult.error.message);
  }

  return {
    editable,
    predictions: rowResult.data
      ? mapRow(rowResult.data as Row)
      : EMPTY_PREDICTIONS(poolId, profileId),
  };
}

export async function getPoolTournamentGeneralPredictionsBoard(
  poolId: string
): Promise<TournamentGeneralPredictionsBoardRow[]> {
  const supabase = await createClient();

  const { data: memberships, error: membersError } = await supabase
    .from("pool_members")
    .select("profile_id")
    .eq("pool_id", poolId);

  if (membersError) {
    throw new Error(membersError.message);
  }

  if (!memberships?.length) return [];

  const profileIds = memberships.map((m) => m.profile_id);

  const [profilesResult, predictionsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, onboarding_completed_at")
      .in("id", profileIds),
    supabase
      .from("tournament_general_predictions")
      .select(
        "profile_id, champion_team, finalist_team_a, finalist_team_b, top_scorer_player_name, top_scorer_team_name, tournament_mvp_player_name, tournament_mvp_team_name, golden_glove_player_name, golden_glove_team_name"
      )
      .eq("pool_id", poolId)
      .in("profile_id", profileIds),
  ]);

  if (profilesResult.error) {
    throw new Error(profilesResult.error.message);
  }
  if (predictionsResult.error) {
    throw new Error(predictionsResult.error.message);
  }

  const predictionsByProfile = new Map(
    (predictionsResult.data ?? []).map((row) => [row.profile_id, row])
  );

  const rows: TournamentGeneralPredictionsBoardRow[] = [];

  for (const profile of profilesResult.data ?? []) {
    if (!isProfileOnboardingComplete(profile)) continue;

    const prediction = predictionsByProfile.get(profile.id);

    rows.push({
      profileId: profile.id,
      label: profile.display_name ?? profile.username,
      avatarUrl: profile.avatar_url,
      championTeam: prediction?.champion_team ?? null,
      finalistTeamA: prediction?.finalist_team_a ?? null,
      finalistTeamB: prediction?.finalist_team_b ?? null,
      topScorerPlayerName: prediction?.top_scorer_player_name ?? null,
      topScorerTeamName: prediction?.top_scorer_team_name ?? null,
      tournamentMvpPlayerName: prediction?.tournament_mvp_player_name ?? null,
      tournamentMvpTeamName: prediction?.tournament_mvp_team_name ?? null,
      goldenGlovePlayerName: prediction?.golden_glove_player_name ?? null,
      goldenGloveTeamName: prediction?.golden_glove_team_name ?? null,
    });
  }

  rows.sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));

  return rows;
}
