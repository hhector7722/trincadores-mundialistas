import { isProfileOnboardingComplete } from "@/lib/auth/onboarding-device";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fetchMvpPredictionsForMatches, getMvpPredictionForMatch, type MvpPrediction } from "@/lib/predictions/mvp-queries";
import {
  isGroupStageMatchdayKey,
  isKnockoutMatchdayKey,
} from "@/lib/predictions/stage-filter";
import type { MatchLivePayload, MatchPlayerIncident } from "@/lib/live/types";
import type { HighlightSourceCode } from "@/lib/youtube/highlight-priority";
import {
  isMvpPredictionCorrect,
  resolveScoreOutcome,
  type ScoreOutcome,
} from "@/lib/predictions/prediction-outcome";
import { predictionEditDeadlineMs } from "@/lib/predictions/deadline";
import { canEditPredictionsUntilKickoff } from "@/lib/predictions/late-edit-access";
import {
  compareLeaderboardRows,
  loadRankingSnapshotThroughKickoff,
} from "@/lib/ranking/queries";
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
  officialPenaltyHome?: number | null;
  officialPenaltyAway?: number | null;
  highlightYoutubeId: string | null;
  highlightPublishedAt: string | null;
  highlightSource: HighlightSourceCode | null;
  prediction:
    | Pick<
        Prediction,
        "id" | "home_goals" | "away_goals" | "advancing_team" | "points_awarded" | "updated_at"
      >
    | null;
  mvpPrediction: MvpPrediction | null;
  playerIncidents: MatchPlayerIncident[];
  serverEditable: boolean;
  editUntilKickoff: boolean;
};

export type MatchDetail = MatchWithPrediction & {
  hasOfficialResult: boolean;
};



async function fetchProfileUsername(profileId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", profileId)
    .maybeSingle();

  return data?.username ?? null;
}

async function fetchPoolMatchesWithPredictions(
  poolId: string,
  profileId: string,
  matchdayFilter: (externalKey: string | null) => boolean
): Promise<MatchWithPrediction[]> {
  const supabase = await createClient();

  // Paso 1: Obtenemos el perfil de usuario y TODOS los partidos de las jornadas del pool simultáneamente
  const [username, { data: matchesData, error: matchesError }] = await Promise.all([
    fetchProfileUsername(profileId),
    supabase
      .from("matches")
      .select(
        "id, matchday_id, home_team, away_team, kickoff_at, status, sort_order, group_code, external_match_id, match_number, highlight_youtube_id, highlight_published_at, highlight_source, matchdays!inner(id, name, external_key)"
      )
      .eq("matchdays.pool_id", poolId)
      .order("kickoff_at", { ascending: true }),
  ]);

  if (matchesError || !matchesData?.length) return [];

  const editUntilKickoff = canEditPredictionsUntilKickoff(username);

  // Filtramos en memoria usando el matchdayFilter
  const matches = matchesData.filter((m) => {
    const md = Array.isArray(m.matchdays) ? m.matchdays[0] : m.matchdays;
    return matchdayFilter(md?.external_key ?? null);
  });

  if (!matches.length) return [];

  const matchIds = matches.map((m) => m.id);

  // Paso 2: Con los IDs de los partidos, traemos TODO lo dependiente en paralelo
  const [
    { data: predictions },
    mvpByMatch,
    { data: results },
    { data: liveStates }
  ] = await Promise.all([
    supabase
      .from("predictions")
      .select("id, match_id, home_goals, away_goals, advancing_team, points_awarded, updated_at")
      .eq("pool_id", poolId)
      .eq("profile_id", profileId)
      .in("match_id", matchIds),
    fetchMvpPredictionsForMatches(poolId, profileId, matchIds),
    supabase
      .from("match_results")
      .select("match_id, home_goals, away_goals, penalty_home, penalty_away, mvp_player_name, mvp_team_name")
      .in("match_id", matchIds),
    supabase
      .from("match_live_state")
      .select("match_id, live_payload")
      .in("match_id", matchIds)
  ]);

  const predByMatch = new Map((predictions ?? []).map((p) => [p.match_id, p]));
  const resultByMatch = new Map((results ?? []).map((r) => [r.match_id, r]));

  const incidentsByMatch = new Map<string, MatchPlayerIncident[]>();
  for (const row of liveStates ?? []) {
    const payload = (row.live_payload ?? {}) as MatchLivePayload;
    incidentsByMatch.set(row.match_id as string, payload.playerIncidents ?? []);
  }

  return matches.map((m) => {
    const pred = predByMatch.get(m.id);
    const result = resultByMatch.get(m.id);
    const status = m.status as MatchStatus;
    const md = Array.isArray(m.matchdays) ? m.matchdays[0] : m.matchdays;
    
    return {
      id: m.id,
      home_team: m.home_team,
      away_team: m.away_team,
      kickoff_at: m.kickoff_at,
      status,
      matchday_name: md?.name ?? "",
      matchday_external_key: md?.external_key ?? null,
      external_match_id: m.external_match_id ?? null,
      match_number: m.match_number ?? null,
      group_code: m.group_code ?? null,
      officialHome: result?.home_goals ?? null,
      officialAway: result?.away_goals ?? null,
      officialMvpPlayerName: result?.mvp_player_name ?? null,
      officialMvpTeamName: result?.mvp_team_name ?? null,
      officialPenaltyHome: result?.penalty_home ?? null,
      officialPenaltyAway: result?.penalty_away ?? null,
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
            advancing_team: pred.advancing_team,
            points_awarded: pred.points_awarded,
            updated_at: pred.updated_at,
          }
        : null,
      mvpPrediction: mvpByMatch.get(m.id) ?? null,
      playerIncidents: incidentsByMatch.get(m.id) ?? [],
      serverEditable: computePredictionEditableLocally(status, m.kickoff_at, {
        untilKickoff: editUntilKickoff,
      }),
      editUntilKickoff,
    };
  });
}

export async function assertMatchInPool(poolId: string, matchId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("matches")
    .select("id, matchdays!inner(pool_id)")
    .eq("id", matchId)
    .eq("matchdays.pool_id", poolId)
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

/** Misma regla que RPC `prediction_edit_allowed`: scheduled y T-5 min (o pitido para Hector). */
export function computePredictionEditableLocally(
  status: MatchStatus,
  kickoffAtIso: string,
  options?: { nowMs?: number; untilKickoff?: boolean }
): boolean {
  if (status !== "scheduled") return false;
  const nowMs = options?.nowMs ?? Date.now();
  const untilKickoff = options?.untilKickoff ?? false;
  return nowMs < predictionEditDeadlineMs(kickoffAtIso, untilKickoff);
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

  const [
    { data: match },
    username,
    { data: prediction },
    { data: result },
    serverEditable,
    mvpPrediction,
    { data: liveState },
  ] = await Promise.all([
    supabase
      .from("matches")
      .select(
        "id, matchday_id, home_team, away_team, kickoff_at, status, group_code, external_match_id, match_number, highlight_youtube_id, highlight_published_at, highlight_source, matchdays!inner(id, name, external_key, pool_id)"
      )
      .eq("id", matchId)
      .eq("matchdays.pool_id", poolId)
      .maybeSingle(),
    fetchProfileUsername(profileId),
    supabase
      .from("predictions")
      .select("id, home_goals, away_goals, advancing_team, points_awarded, updated_at")
      .eq("pool_id", poolId)
      .eq("profile_id", profileId)
      .eq("match_id", matchId)
      .maybeSingle(),
    supabase
      .from("match_results")
      .select("home_goals, away_goals, penalty_home, penalty_away, mvp_player_name, mvp_team_name")
      .eq("match_id", matchId)
      .maybeSingle(),
    fetchMatchEditableFromDb(matchId),
    getMvpPredictionForMatch(poolId, profileId, matchId),
    supabase
      .from("match_live_state")
      .select("live_payload")
      .eq("match_id", matchId)
      .maybeSingle(),
  ]);

  if (!match) return null;

  const editUntilKickoff = canEditPredictionsUntilKickoff(username);

  const livePayload = (liveState?.live_payload ?? {}) as MatchLivePayload;

  const md = Array.isArray(match.matchdays) ? match.matchdays[0] : match.matchdays;

  return {
    id: match.id,
    home_team: match.home_team,
    away_team: match.away_team,
    kickoff_at: match.kickoff_at,
    status: match.status as MatchStatus,
    matchday_name: md?.name ?? "",
    matchday_external_key: md?.external_key ?? null,
    external_match_id: match.external_match_id ?? null,
    match_number: match.match_number ?? null,
    group_code: match.group_code ?? null,
    prediction: prediction
      ? {
          id: prediction.id,
          home_goals: prediction.home_goals,
          away_goals: prediction.away_goals,
          advancing_team: prediction.advancing_team,
          points_awarded: prediction.points_awarded,
          updated_at: prediction.updated_at,
        }
      : null,
    mvpPrediction,
    serverEditable,
    editUntilKickoff,
    hasOfficialResult: !!result,
    officialHome: result?.home_goals ?? null,
    officialAway: result?.away_goals ?? null,
    officialMvpPlayerName: result?.mvp_player_name ?? null,
    officialMvpTeamName: result?.mvp_team_name ?? null,
    officialPenaltyHome: result?.penalty_home ?? null,
    officialPenaltyAway: result?.penalty_away ?? null,
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
  currentHomeGoals: number | null;
  currentAwayGoals: number | null;
  currentMvpPlayerName: string | null;
  currentMvpTeamName: string | null;
  currentPenaltyHome: number | null;
  currentPenaltyAway: number | null;
};

export async function getAdminOpenMatches(poolId: string): Promise<AdminOpenMatch[]> {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, status, matchdays!inner(pool_id)")
    .eq("matchdays.pool_id", poolId)
    .in("status", ["pending", "scheduled", "live", "finished"])
    .order("kickoff_at", { ascending: false });

  if (!matches?.length) return [];

  const ids = matches.map((m) => m.id);
  const { data: results } = await supabase
    .from("match_results")
    .select("match_id, home_goals, away_goals, mvp_player_name, mvp_team_name, penalty_home, penalty_away")
    .in("match_id", ids);

  const resultMap = new Map(
    (results ?? []).map((r) => [r.match_id, r])
  );

  return matches.map((m) => {
    const result = resultMap.get(m.id);
    return {
      id: m.id,
      home_team: m.home_team,
      away_team: m.away_team,
      kickoff_at: m.kickoff_at,
      status: m.status as MatchStatus,
      hasResult: Boolean(result),
      currentHomeGoals: result?.home_goals ?? null,
      currentAwayGoals: result?.away_goals ?? null,
      currentMvpPlayerName: result?.mvp_player_name ?? null,
      currentMvpTeamName: result?.mvp_team_name ?? null,
      currentPenaltyHome: result?.penalty_home ?? null,
      currentPenaltyAway: result?.penalty_away ?? null,
    };
  });
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
  advancingTeam: "home" | "away" | null;
  mvpPlayerName: string | null;
  scoreOutcome: ScoreOutcome | null;
  mvpCorrect: boolean;
};

export type MatchPredictionsBoard = {
  homeTeam: string;
  awayTeam: string;
  officialHome: number | null;
  officialAway: number | null;
  officialMvpPlayerName: string | null;
  officialMvpTeamName: string | null;
  showOutcomes: boolean;
  playerIncidents: MatchPlayerIncident[];
  isKnockout: boolean;
  rows: MatchPredictionsBoardRow[];
};

function hasOfficialScore(
  homeGoals: number | null | undefined,
  awayGoals: number | null | undefined,
): homeGoals is number {
  return (
    homeGoals != null &&
    awayGoals != null &&
    Number.isInteger(homeGoals) &&
    Number.isInteger(awayGoals)
  );
}

function hasSavedScorePrediction(
  homeGoals: number | null,
  awayGoals: number | null,
): homeGoals is number {
  return (
    homeGoals !== null &&
    awayGoals !== null &&
    Number.isInteger(homeGoals) &&
    Number.isInteger(awayGoals)
  );
}

export async function getMatchPredictionsBoard(
  poolId: string,
  matchId: string,
  viewerId: string
): Promise<MatchPredictionsBoard | null> {
  const userClient = await createClient();
  const admin = createAdminClient();

  const [
    canViewRes,
    matchRes,
    resultRes,
    liveStateRes,
    membershipsRes,
    predictionsRes,
    mvpRes,
  ] = await Promise.all([
    userClient.rpc("can_view_peer_predictions", {
      p_pool_id: poolId,
      p_match_id: matchId,
      p_viewer: viewerId,
    }),
    admin
      .from("matches")
      .select("id, home_team, away_team, status, kickoff_at, matchday_id, matchdays(external_key)")
      .eq("id", matchId)
      .maybeSingle(),
    admin
      .from("match_results")
      .select("home_goals, away_goals, penalty_home, penalty_away, mvp_player_name, mvp_team_name")
      .eq("match_id", matchId)
      .maybeSingle(),
    admin
      .from("match_live_state")
      .select("home_score, away_score, live_payload")
      .eq("match_id", matchId)
      .maybeSingle(),
    admin
      .from("pool_members")
      .select("profile_id, profiles(id, username, display_name, avatar_url, onboarding_completed_at)")
      .eq("pool_id", poolId),
    admin
      .from("predictions")
      .select("profile_id, home_goals, away_goals, advancing_team")
      .eq("pool_id", poolId)
      .eq("match_id", matchId),
    admin
      .from("match_mvp_predictions")
      .select("profile_id, player_name, team_name")
      .eq("pool_id", poolId)
      .eq("match_id", matchId),
  ]);

  if (canViewRes.error) throw new Error(canViewRes.error.message);
  if (!canViewRes.data) return null;

  if (matchRes.error) throw new Error(matchRes.error.message);
  if (!matchRes.data) return null;
  const match = matchRes.data;

  if (resultRes.error) throw new Error(resultRes.error.message);
  const result = resultRes.data;

  const showOutcomes =
    match.status === "finished" &&
    hasOfficialScore(result?.home_goals, result?.away_goals);

  let officialHome: number | null = null;
  let officialAway: number | null = null;
  let playerIncidents: MatchPlayerIncident[] = [];

  if (hasOfficialScore(result?.home_goals, result?.away_goals)) {
    officialHome = result!.home_goals;
    officialAway = result!.away_goals;
  }

  if (match.status === "live" || match.status === "finished") {
    if (liveStateRes.error) throw new Error(liveStateRes.error.message);
    const liveState = liveStateRes.data;

    const livePayload = (liveState?.live_payload ?? {}) as MatchLivePayload;
    playerIncidents = livePayload.playerIncidents ?? [];

    if (officialHome == null && hasOfficialScore(liveState?.home_score, liveState?.away_score)) {
      officialHome = liveState!.home_score;
      officialAway = liveState!.away_score;
    }
  }

  if (membershipsRes.error) throw new Error(membershipsRes.error.message);
  const memberships = membershipsRes.data ?? [];

  if (!memberships.length) {
    return {
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      officialHome,
      officialAway,
      officialMvpPlayerName: result?.mvp_player_name ?? null,
      officialMvpTeamName: result?.mvp_team_name ?? null,
      showOutcomes,
      playerIncidents,
      isKnockout: isKnockoutMatchdayKey((match.matchdays as any)?.external_key),
      rows: [],
    };
  }

  if (predictionsRes.error) throw new Error(predictionsRes.error.message);
  if (mvpRes.error) throw new Error(mvpRes.error.message);

  const predictionsByProfile = new Map(
    (predictionsRes.data ?? []).map((row) => [row.profile_id, row])
  );
  const mvpByProfile = new Map(
    (mvpRes.data ?? []).map((row) => [row.profile_id, row])
  );

  const rows: MatchPredictionsBoardRow[] = [];

  for (const m of memberships) {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    if (!profile) continue;
    if (!isProfileOnboardingComplete(profile as any)) continue;

    const prediction = predictionsByProfile.get(profile.id);
    const mvpPrediction = mvpByProfile.get(profile.id);
    const homeGoals = prediction?.home_goals ?? null;
    const awayGoals = prediction?.away_goals ?? null;

    const scoreOutcome =
      showOutcomes && hasSavedScorePrediction(homeGoals, awayGoals)
        ? resolveScoreOutcome({
            predictedHome: homeGoals,
            predictedAway: awayGoals,
            predictedAdvancing: prediction?.advancing_team as "home" | "away" | null,
            resultHome: result!.home_goals,
            resultAway: result!.away_goals,
            resultPenaltyHome: result?.penalty_home,
            resultPenaltyAway: result?.penalty_away,
            isKnockout: isKnockoutMatchdayKey((match.matchdays as any)?.external_key),
          })
        : null;

    const mvpCorrect =
      showOutcomes &&
      !!mvpPrediction?.player_name &&
      isMvpPredictionCorrect(
        mvpPrediction.player_name,
        mvpPrediction.team_name,
        result?.mvp_player_name,
        result?.mvp_team_name,
      );

    rows.push({
      profileId: profile.id,
      label: profile.display_name ?? profile.username,
      avatarUrl: profile.avatar_url,
      homeGoals,
      awayGoals,
      advancingTeam: (prediction?.advancing_team as "home" | "away" | null) ?? null,
      mvpPlayerName: mvpPrediction?.player_name ?? null,
      scoreOutcome,
      mvpCorrect,
    });
  }

  if (showOutcomes && match.kickoff_at) {
    const rankingSnapshot = await loadRankingSnapshotThroughKickoff(poolId, match.kickoff_at);
    rows.sort((a, b) => {
      const snapshotA = rankingSnapshot.get(a.profileId);
      const snapshotB = rankingSnapshot.get(b.profileId);
      return compareLeaderboardRows(
        {
          label: a.label,
          cumulativePoints: snapshotA?.cumulativePoints ?? 0,
          exactHits: snapshotA?.exactHits ?? 0,
          signHits: snapshotA?.signHits ?? 0,
          mvpHits: snapshotA?.mvpHits ?? 0,
          globalHits: snapshotA?.globalHits ?? 0,
        },
        {
          label: b.label,
          cumulativePoints: snapshotB?.cumulativePoints ?? 0,
          exactHits: snapshotB?.exactHits ?? 0,
          signHits: snapshotB?.signHits ?? 0,
          mvpHits: snapshotB?.mvpHits ?? 0,
          globalHits: snapshotB?.globalHits ?? 0,
        }
      );
    });
  } else {
    rows.sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
  }

  return {
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    officialHome,
    officialAway,
    officialMvpPlayerName: result?.mvp_player_name ?? null,
    officialMvpTeamName: result?.mvp_team_name ?? null,
    showOutcomes,
    playerIncidents,
    isKnockout: isKnockoutMatchdayKey((match.matchdays as any)?.external_key),
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
    .select("profile_id, home_goals, away_goals, advancing_team, points_awarded")
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