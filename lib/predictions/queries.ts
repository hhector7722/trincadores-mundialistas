import { isProfileOnboardingComplete } from "@/lib/auth/onboarding-device";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fetchMvpPredictionsForMatches, getMvpPredictionForMatch, type MvpPrediction } from "@/lib/predictions/mvp-queries";
import {
  isGroupStageMatchdayKey,
  isKnockoutMatchdayKey,
} from "@/lib/predictions/stage-filter";
import type { MatchLivePayload, MatchPlayerIncident } from "@/lib/live/types";
import type { MatchStatus, Prediction } from "@/types/database";

export type MatchWithPrediction = {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  status: MatchStatus;
  matchday_name: string;
  matchday_external_key: string | null;
  external_match_id: string | null;
  match_number: number | null;
  group_code: string | null;
  officialHome: number | null;
  officialAway: number | null;
  officialMvpPlayerName: string | null;
  officialMvpTeamName: string | null;
  highlightYoutubeId: string | null;
  highlightPublishedAt: string | null;
  highlightSource: "youtube_dazn_es" | "youtube_fifa" | "youtube_rtve_teledeporte" | null;
  prediction:
    | Pick<
        Prediction,
        "id" | "home_goals" | "away_goals" | "points_awarded" | "updated_at"
      >
    | null;
  mvpPrediction: MvpPrediction | null;
  playerIncidents: MatchPlayerIncident[];
  serverEditable: boolean;
};

export type MatchDetail = MatchWithPrediction & {
  hasOfficialResult: boolean;
};

async function getMatchdayMap(poolId: string) {
  const supabase = await createClient();
  const { data: matchdays } = await supabase
    .from("matchdays")
    .select("id, name, external_key, sequence")
    .eq("pool_id", poolId)
    .order("sequence", { ascending: true });

  if (!matchdays?.length) {
    return {
      dayMap: new Map<string, string>(),
      externalKeyMap: new Map<string, string | null>(),
      dayIds: [] as string[],
    };
  }

  return {
    dayMap: new Map(matchdays.map((d) => [d.id, d.name])),
    externalKeyMap: new Map(matchdays.map((d) => [d.id, d.external_key])),
    dayIds: matchdays.map((d) => d.id),
  };
}

async function fetchPoolMatchesWithPredictions(
  poolId: string,
  profileId: string,
  matchdayFilter: (externalKey: string | null) => boolean
): Promise<MatchWithPrediction[]> {
  const supabase = await createClient();
  const { dayMap, externalKeyMap, dayIds } = await getMatchdayMap(poolId);
  const filteredDayIds = dayIds.filter((id) =>
    matchdayFilter(externalKeyMap.get(id) ?? null)
  );
  if (!filteredDayIds.length) return [];

  const { data: matches } = await supabase
    .from("matches")
    .select(
      "id, matchday_id, home_team, away_team, kickoff_at, status, sort_order, group_code, external_match_id, match_number, highlight_youtube_id, highlight_published_at, highlight_source"
    )
    .in("matchday_id", filteredDayIds)
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
  const mvpByMatch = await fetchMvpPredictionsForMatches(poolId, profileId, matchIds);

  const { data: results } = await supabase
    .from("match_results")
    .select("match_id, home_goals, away_goals, mvp_player_name, mvp_team_name")
    .in("match_id", matchIds);

  const resultByMatch = new Map((results ?? []).map((r) => [r.match_id, r]));

  const { data: liveStates } = await supabase
    .from("match_live_state")
    .select("match_id, live_payload")
    .in("match_id", matchIds);

  const incidentsByMatch = new Map<string, MatchPlayerIncident[]>();
  for (const row of liveStates ?? []) {
    const payload = (row.live_payload ?? {}) as MatchLivePayload;
    incidentsByMatch.set(row.match_id as string, payload.playerIncidents ?? []);
  }

  return matches.map((m) => {
    const pred = predByMatch.get(m.id);
    const result = resultByMatch.get(m.id);
    const status = m.status as MatchStatus;
    return {
      id: m.id,
      home_team: m.home_team,
      away_team: m.away_team,
      kickoff_at: m.kickoff_at,
      status,
      matchday_name: dayMap.get(m.matchday_id) ?? "",
      matchday_external_key: externalKeyMap.get(m.matchday_id) ?? null,
      external_match_id: m.external_match_id ?? null,
      match_number: m.match_number ?? null,
      group_code: m.group_code ?? null,
      officialHome: result?.home_goals ?? null,
      officialAway: result?.away_goals ?? null,
      officialMvpPlayerName: result?.mvp_player_name ?? null,
      officialMvpTeamName: result?.mvp_team_name ?? null,
      highlightYoutubeId:
        status === "finished" ? (m.highlight_youtube_id ?? null) : null,
      highlightPublishedAt:
        status === "finished" ? (m.highlight_published_at ?? null) : null,
      highlightSource:
        status === "finished" ? (m.highlight_source as MatchWithPrediction["highlightSource"]) : null,
      prediction: pred
        ? {
            id: pred.id,
            home_goals: pred.home_goals,
            away_goals: pred.away_goals,
            points_awarded: pred.points_awarded,
            updated_at: pred.updated_at,
          }
        : null,
      mvpPrediction: mvpByMatch.get(m.id) ?? null,
      playerIncidents: incidentsByMatch.get(m.id) ?? [],
      serverEditable: computePredictionEditableLocally(status, m.kickoff_at),
    };
  });
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

const PREDICTION_LOCK_MS = 5 * 60 * 1000;

/** Misma regla que RPC `prediction_edit_allowed`: scheduled y T-5 min. */
export function computePredictionEditableLocally(
  status: MatchStatus,
  kickoffAtIso: string,
  nowMs: number = Date.now()
): boolean {
  if (status !== "scheduled") return false;
  return nowMs < new Date(kickoffAtIso).getTime() - PREDICTION_LOCK_MS;
}

export async function getPoolMatchesWithPredictions(
  poolId: string,
  profileId: string
): Promise<MatchWithPrediction[]> {
  return fetchPoolMatchesWithPredictions(poolId, profileId, () => true);
}

export async function getPoolGroupStageMatchesWithPredictions(
  poolId: string,
  profileId: string
): Promise<MatchWithPrediction[]> {
  return fetchPoolMatchesWithPredictions(poolId, profileId, isGroupStageMatchdayKey);
}

export async function getPoolKnockoutMatchesWithPredictions(
  poolId: string,
  profileId: string
): Promise<MatchWithPrediction[]> {
  return fetchPoolMatchesWithPredictions(poolId, profileId, isKnockoutMatchdayKey);
}

export async function getMatchPredictionDetail(
  poolId: string,
  profileId: string,
  matchId: string
): Promise<MatchDetail | null> {
  const supabase = await createClient();
  const { dayMap, externalKeyMap, dayIds } = await getMatchdayMap(poolId);
  if (!dayIds.length) return null;

  const { data: match } = await supabase
    .from("matches")
    .select(
      "id, matchday_id, home_team, away_team, kickoff_at, status, group_code, external_match_id, match_number, highlight_youtube_id, highlight_published_at, highlight_source"
    )
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
    .select("home_goals, away_goals, mvp_player_name, mvp_team_name")
    .eq("match_id", matchId)
    .maybeSingle();

  const [serverEditable, mvpPrediction, liveState] = await Promise.all([
    fetchMatchEditableFromDb(matchId),
    getMvpPredictionForMatch(poolId, profileId, matchId),
    supabase
      .from("match_live_state")
      .select("live_payload")
      .eq("match_id", matchId)
      .maybeSingle(),
  ]);

  const livePayload = (liveState.data?.live_payload ?? {}) as MatchLivePayload;

  return {
    id: match.id,
    home_team: match.home_team,
    away_team: match.away_team,
    kickoff_at: match.kickoff_at,
    status: match.status as MatchStatus,
    matchday_name: dayMap.get(match.matchday_id) ?? "",
    matchday_external_key: externalKeyMap.get(match.matchday_id) ?? null,
    external_match_id: match.external_match_id ?? null,
    match_number: match.match_number ?? null,
    group_code: match.group_code ?? null,
    prediction: prediction
      ? {
          id: prediction.id,
          home_goals: prediction.home_goals,
          away_goals: prediction.away_goals,
          points_awarded: prediction.points_awarded,
          updated_at: prediction.updated_at,
        }
      : null,
    mvpPrediction,
    serverEditable,
    hasOfficialResult: !!result,
    officialHome: result?.home_goals ?? null,
    officialAway: result?.away_goals ?? null,
    officialMvpPlayerName: result?.mvp_player_name ?? null,
    officialMvpTeamName: result?.mvp_team_name ?? null,
    highlightYoutubeId:
      match.status === "finished" ? (match.highlight_youtube_id ?? null) : null,
    highlightPublishedAt:
      match.status === "finished" ? (match.highlight_published_at ?? null) : null,
    highlightSource:
      match.status === "finished"
        ? (match.highlight_source as MatchWithPrediction["highlightSource"])
        : null,
    playerIncidents: livePayload.playerIncidents ?? [],
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

export type MatchPredictionsBoardRow = {
  profileId: string;
  label: string;
  avatarUrl: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
  mvpPlayerName: string | null;
};

export type MatchPredictionsBoard = {
  homeTeam: string;
  awayTeam: string;
  rows: MatchPredictionsBoardRow[];
};

export async function getMatchPredictionsBoard(
  poolId: string,
  matchId: string,
  viewerId: string
): Promise<MatchPredictionsBoard | null> {
  const userClient = await createClient();

  const { data: canView, error: visibilityError } = await userClient.rpc(
    "can_view_peer_predictions",
    {
      p_pool_id: poolId,
      p_match_id: matchId,
      p_viewer: viewerId,
    }
  );

  if (visibilityError) {
    throw new Error(visibilityError.message);
  }
  if (!canView) {
    return null;
  }

  const admin = createAdminClient();

  const { data: match, error: matchError } = await admin
    .from("matches")
    .select("id, home_team, away_team")
    .eq("id", matchId)
    .maybeSingle();

  if (matchError) throw new Error(matchError.message);
  if (!match) return null;

  const { data: memberships, error: membersError } = await admin
    .from("pool_members")
    .select("profile_id")
    .eq("pool_id", poolId);

  if (membersError) throw new Error(membersError.message);
  if (!memberships?.length) {
    return { homeTeam: match.home_team, awayTeam: match.away_team, rows: [] };
  }

  const profileIds = memberships.map((m) => m.profile_id);

  const [profilesResult, predictionsResult, mvpResult] = await Promise.all([
    admin
      .from("profiles")
      .select("id, username, display_name, avatar_url, onboarding_completed_at")
      .in("id", profileIds),
    admin
      .from("predictions")
      .select("profile_id, home_goals, away_goals")
      .eq("pool_id", poolId)
      .eq("match_id", matchId),
    admin
      .from("match_mvp_predictions")
      .select("profile_id, player_name")
      .eq("pool_id", poolId)
      .eq("match_id", matchId),
  ]);

  if (profilesResult.error) throw new Error(profilesResult.error.message);
  if (predictionsResult.error) throw new Error(predictionsResult.error.message);
  if (mvpResult.error) throw new Error(mvpResult.error.message);

  const predictionsByProfile = new Map(
    (predictionsResult.data ?? []).map((row) => [row.profile_id, row])
  );
  const mvpByProfile = new Map(
    (mvpResult.data ?? []).map((row) => [row.profile_id, row.player_name])
  );

  const rows: MatchPredictionsBoardRow[] = [];

  for (const profile of profilesResult.data ?? []) {
    if (!isProfileOnboardingComplete(profile)) continue;

    const prediction = predictionsByProfile.get(profile.id);

    rows.push({
      profileId: profile.id,
      label: profile.display_name ?? profile.username,
      avatarUrl: profile.avatar_url,
      homeGoals: prediction?.home_goals ?? null,
      awayGoals: prediction?.away_goals ?? null,
      mvpPlayerName: mvpByProfile.get(profile.id) ?? null,
    });
  }

  rows.sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));

  return {
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    rows,
  };
}

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