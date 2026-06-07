import { createClient } from "@/lib/supabase/server";

export type MvpPrediction = {
  id: string;
  player_name: string;
  team_name: string;
  points_awarded: number | null;
  updated_at: string;
};

export async function fetchMvpPredictionsForMatches(
  poolId: string,
  profileId: string,
  matchIds: string[]
): Promise<Map<string, MvpPrediction>> {
  if (!matchIds.length) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("match_mvp_predictions")
    .select("id, match_id, player_name, team_name, points_awarded, updated_at")
    .eq("pool_id", poolId)
    .eq("profile_id", profileId)
    .in("match_id", matchIds);

  if (error) throw error;

  return new Map(
    (data ?? []).map((row) => [
      row.match_id,
      {
        id: row.id,
        player_name: row.player_name,
        team_name: row.team_name,
        points_awarded: row.points_awarded,
        updated_at: row.updated_at,
      },
    ])
  );
}

export async function getMvpPredictionForMatch(
  poolId: string,
  profileId: string,
  matchId: string
): Promise<MvpPrediction | null> {
  const map = await fetchMvpPredictionsForMatches(poolId, profileId, [matchId]);
  return map.get(matchId) ?? null;
}
