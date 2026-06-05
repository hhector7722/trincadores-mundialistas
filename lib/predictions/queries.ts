import { createClient } from "@/lib/supabase/server";
import type { MatchStatus, Prediction } from "@/types/database";

export type MatchWithPrediction = {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  status: MatchStatus;
  matchday_name: string;
  prediction:
    | Pick<
        Prediction,
        "id" | "home_goals" | "away_goals" | "points_awarded" | "updated_at"
      >
    | null;
  serverEditable: boolean;
};

export type MatchDetail = MatchWithPrediction & {
  hasOfficialResult: boolean;
  officialHome: number | null;
  officialAway: number | null;
};

async function getMatchdayMap(poolId: string) {
  const supabase = await createClient();
  const { data: matchdays } = await supabase
    .from("matchdays")
    .select("id, name")
    .eq("pool_id", poolId);

  if (!matchdays?.length) {
    return { dayMap: new Map<string, string>(), dayIds: [] as string[] };
  }

  return {
    dayMap: new Map(matchdays.map((d) => [d.id, d.name])),
    dayIds: matchdays.map((d) => d.id),
  };
}

export async function assertMatchInPool(poolId: string, matchId: string): Promise<boolean> {
  const supabase = await createClient();
  const { dayIds } = await getMatchdayMap(poolId);
  if (!dayIds.length) return false;

  const { data } = await supabase
    .from("matches")
    .select("id")
    .eq("id", matchId)
    .in("matchday_id", dayIds)
    .maybeSingle();

  return !!data;
}

export async function fetchMatchEditableFromDb(matchId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("prediction_edit_allowed", {
    p_match_id: matchId,
  });
  if (error) return false;
  return data === true;
}

/** Fuente unica de verdad: RPC Postgres por partido. */
export async function fetchEditableByMatchIds(
  matchIds: string[]
): Promise<Map<string, boolean>> {
  if (!matchIds.length) return new Map();

  const entries = await Promise.all(
    matchIds.map(async (id) => [id, await fetchMatchEditableFromDb(id)] as const)
  );
  return new Map(entries);
}

export async function getPoolMatchesWithPredictions(
  poolId: string,
  profileId: string
): Promise<MatchWithPrediction[]> {
  const supabase = await createClient();
  const { dayMap, dayIds } = await getMatchdayMap(poolId);
  if (!dayIds.length) return [];

  const { data: matches } = await supabase
    .from("matches")
    .select("id, matchday_id, home_team, away_team, kickoff_at, status, sort_order")
    .in("matchday_id", dayIds)
    .order("kickoff_at", { ascending: true });

  if (!matches?.length) return [];

  const matchIds = matches.map((m) => m.id);
  const { data: predictions } = await supabase
    .from("predictions")
    .select("id, match_id, home_goals, away_goals, points_awarded, updated_at")
    .eq("pool_id", poolId)
    .eq("profile_id", profileId)
    .in("match_id", matchIds);

  const predByMatch = new Map((predictions ?? []).map((p) => [p.match_id, p]));
  const editableByMatch = await fetchEditableByMatchIds(matchIds);

  return matches.map((m) => {
    const pred = predByMatch.get(m.id);
    return {
      id: m.id,
      home_team: m.home_team,
      away_team: m.away_team,
      kickoff_at: m.kickoff_at,
      status: m.status as MatchStatus,
      matchday_name: dayMap.get(m.matchday_id) ?? "",
      prediction: pred
        ? {
            id: pred.id,
            home_goals: pred.home_goals,
            away_goals: pred.away_goals,
            points_awarded: pred.points_awarded,
            updated_at: pred.updated_at,
          }
        : null,
      serverEditable: editableByMatch.get(m.id) ?? false,
    };
  });
}

export async function getMatchPredictionDetail(
  poolId: string,
  profileId: string,
  matchId: string
): Promise<MatchDetail | null> {
  const supabase = await createClient();
  const { dayMap, dayIds } = await getMatchdayMap(poolId);
  if (!dayIds.length) return null;

  const { data: match } = await supabase
    .from("matches")
    .select("id, matchday_id, home_team, away_team, kickoff_at, status")
    .eq("id", matchId)
    .in("matchday_id", dayIds)
    .maybeSingle();

  if (!match) return null;

  const { data: prediction } = await supabase
    .from("predictions")
    .select("id, home_goals, away_goals, points_awarded, updated_at")
    .eq("pool_id", poolId)
    .eq("profile_id", profileId)
    .eq("match_id", matchId)
    .maybeSingle();

  const { data: result } = await supabase
    .from("match_results")
    .select("home_goals, away_goals")
    .eq("match_id", matchId)
    .maybeSingle();

  const serverEditable = await fetchMatchEditableFromDb(matchId);

  return {
    id: match.id,
    home_team: match.home_team,
    away_team: match.away_team,
    kickoff_at: match.kickoff_at,
    status: match.status as MatchStatus,
    matchday_name: dayMap.get(match.matchday_id) ?? "",
    prediction: prediction
      ? {
          id: prediction.id,
          home_goals: prediction.home_goals,
          away_goals: prediction.away_goals,
          points_awarded: prediction.points_awarded,
          updated_at: prediction.updated_at,
        }
      : null,
    serverEditable,
    hasOfficialResult: !!result,
    officialHome: result?.home_goals ?? null,
    officialAway: result?.away_goals ?? null,
  };
}

export async function countPendingPredictions(
  poolId: string,
  profileId: string
): Promise<number> {
  const rows = await getPoolMatchesWithPredictions(poolId, profileId);
  return rows.filter(
    (m) => m.status === "scheduled" && m.serverEditable && m.prediction === null
  ).length;
}

export type AdminOpenMatch = {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  status: MatchStatus;
  hasResult: boolean;
};

export async function getAdminOpenMatches(poolId: string): Promise<AdminOpenMatch[]> {
  const supabase = await createClient();
  const { dayIds } = await getMatchdayMap(poolId);
  if (!dayIds.length) return [];

  const { data: matches } = await supabase
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, status")
    .in("matchday_id", dayIds)
    .in("status", ["scheduled", "live"])
    .order("kickoff_at", { ascending: true });

  if (!matches?.length) return [];

  const ids = matches.map((m) => m.id);
  const { data: results } = await supabase
    .from("match_results")
    .select("match_id")
    .in("match_id", ids);

  const withResult = new Set((results ?? []).map((r) => r.match_id));

  return matches.map((m) => ({
    id: m.id,
    home_team: m.home_team,
    away_team: m.away_team,
    kickoff_at: m.kickoff_at,
    status: m.status as MatchStatus,
    hasResult: withResult.has(m.id),
  }));
}
export type PeerPredictionRow = {
  profileId: string;
  label: string;
  homeGoals: number;
  awayGoals: number;
  pointsAwarded: number | null;
};

export function arePeerPredictionsLikelyVisible(
  status: MatchStatus,
  kickoffAtIso: string,
  nowMs: number = Date.now()
): boolean {
  if (status === "live" || status === "finished") return true;
  return nowMs >= new Date(kickoffAtIso).getTime();
}

export async function getPeerPredictionsForMatch(
  poolId: string,
  matchId: string,
  viewerProfileId: string
): Promise<PeerPredictionRow[]> {
  const supabase = await createClient();
  const { data: predictions, error } = await supabase
    .from("predictions")
    .select("profile_id, home_goals, away_goals, points_awarded")
    .eq("pool_id", poolId)
    .eq("match_id", matchId)
    .neq("profile_id", viewerProfileId);

  if (error || !predictions?.length) return [];

  const profileIds = predictions.map((p) => p.profile_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", profileIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.display_name ?? p.username])
  );

  return predictions
    .map((p) => ({
      profileId: p.profile_id,
      label: profileMap.get(p.profile_id) ?? " ",
      homeGoals: p.home_goals,
      awayGoals: p.away_goals,
      pointsAwarded: p.points_awarded,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}