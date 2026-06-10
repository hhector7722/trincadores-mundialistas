import { createClient } from "@/lib/supabase/server";

export type MvpPrediction = {
  id: string;
  player_name: string;
  team_name: string;
  shirt_number: number | null;
  points_awarded: number | null;
  updated_at: string;
};

const MVP_MATCH_ID_BATCH = 40;

export async function fetchMvpPredictionsForMatches(
  poolId: string,
  profileId: string,
  matchIds: string[]
): Promise<Map<string, MvpPrediction>> {
  if (!matchIds.length) return new Map();

  const supabase = await createClient();
  const result = new Map<string, MvpPrediction>();

  for (let offset = 0; offset < matchIds.length; offset += MVP_MATCH_ID_BATCH) {
    const batch = matchIds.slice(offset, offset + MVP_MATCH_ID_BATCH);
    const { data, error } = await supabase
      .from("match_mvp_predictions")
      .select("id, match_id, player_name, team_name, shirt_number, points_awarded, updated_at")
      .eq("pool_id", poolId)
      .eq("profile_id", profileId)
      .in("match_id", batch);

    if (error) throw error;

    for (const row of data ?? []) {
      result.set(row.match_id, {
        id: row.id,
        player_name: row.player_name,
        team_name: row.team_name,
        shirt_number: row.shirt_number ?? null,
        points_awarded: row.points_awarded,
        updated_at: row.updated_at,
      });
    }
  }

  return result;
}

export async function getMvpPredictionForMatch(
  poolId: string,
  profileId: string,
  matchId: string
): Promise<MvpPrediction | null> {
  const map = await fetchMvpPredictionsForMatches(poolId, profileId, [matchId]);
  return map.get(matchId) ?? null;
}
