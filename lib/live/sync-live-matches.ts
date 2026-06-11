import { BSD_SOURCE_CODE } from "@/lib/lineup/sources/bsd-constants";
import { isBsdConfigured } from "@/lib/lineup/sources/bsd-client";
import {
  fetchBsdLiveBundle,
  fetchBsdLiveLeagueEvents,
  isBsdEventFinished,
  isBsdEventLive,
} from "@/lib/live/sources/bsd-live";
import type { AdminClient } from "@/lib/scripts/supabase-admin";

type MatchRow = {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  status: string;
};

export type SyncLiveMatchesResult = {
  scanned: number;
  updated: number;
  markedLive: number;
  markedFinished: number;
  resultsPersisted: number;
  scoresRecalculated: number;
  poolsRebuilt: number;
  errors: string[];
};

async function loadCandidateMatches(admin: AdminClient, nowMs: number): Promise<MatchRow[]> {
  const fromIso = new Date(nowMs - 4 * 60 * 60 * 1000).toISOString();
  const toIso = new Date(nowMs + 30 * 60 * 1000).toISOString();
  const finishedFromIso = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString();

  const [windowed, liveOngoing, recentlyFinished] = await Promise.all([
    admin
      .from("matches")
      .select("id, home_team, away_team, kickoff_at, status")
      .in("status", ["scheduled", "live"])
      .gte("kickoff_at", fromIso)
      .lte("kickoff_at", toIso),
    admin
      .from("matches")
      .select("id, home_team, away_team, kickoff_at, status")
      .eq("status", "live"),
    admin
      .from("matches")
      .select("id, home_team, away_team, kickoff_at, status")
      .eq("status", "finished")
      .gte("kickoff_at", finishedFromIso),
  ]);

  if (windowed.error) throw new Error(`matches: ${windowed.error.message}`);
  if (liveOngoing.error) throw new Error(`matches live: ${liveOngoing.error.message}`);
  if (recentlyFinished.error) {
    throw new Error(`matches finished: ${recentlyFinished.error.message}`);
  }

  const byId = new Map<string, MatchRow>();
  for (const row of [
    ...(windowed.data ?? []),
    ...(liveOngoing.data ?? []),
    ...(recentlyFinished.data ?? []),
  ]) {
    byId.set(row.id, row as MatchRow);
  }
  return [...byId.values()];
}

async function loadBsdEventMap(
  admin: AdminClient,
  matchIds: string[],
): Promise<Map<string, string>> {
  if (!matchIds.length) return new Map();

  const { data, error } = await admin
    .from("external_id_map")
    .select("internal_id, external_key")
    .eq("source_code", BSD_SOURCE_CODE)
    .eq("entity_type", "match")
    .eq("match_status", "mapped")
    .in("internal_id", matchIds);

  if (error) throw new Error(`external_id_map: ${error.message}`);

  return new Map((data ?? []).map((row) => [row.internal_id as string, row.external_key as string]));
}

async function ensureFinishedMatchScoring(
  admin: AdminClient,
  matchId: string,
  result: SyncLiveMatchesResult,
  poolsToRebuild: Set<string>,
): Promise<void> {
  const { data: officialResult } = await admin
    .from("match_results")
    .select("match_id")
    .eq("match_id", matchId)
    .maybeSingle();

  if (!officialResult) return;

  const { error: recalcError } = await admin.rpc("recalculate_match_scores", {
    p_match_id: matchId,
  });
  if (recalcError) {
    result.errors.push(`${matchId}/recalc: ${recalcError.message}`);
    return;
  }
  result.scoresRecalculated += 1;

  const poolId = await loadPoolIdForMatch(admin, matchId);
  if (poolId) poolsToRebuild.add(poolId);
}

async function loadPoolIdForMatch(admin: AdminClient, matchId: string): Promise<string | null> {
  const { data, error } = await admin
    .from("matches")
    .select("matchdays!inner(pool_id)")
    .eq("id", matchId)
    .maybeSingle();

  if (error || !data) return null;

  const matchdays = (data as { matchdays: { pool_id: string } | { pool_id: string }[] }).matchdays;
  if (Array.isArray(matchdays)) return matchdays[0]?.pool_id ?? null;
  return matchdays.pool_id ?? null;
}

async function persistOfficialResultFromLive(
  admin: AdminClient,
  matchId: string,
  homeGoals: number,
  awayGoals: number,
): Promise<boolean> {
  const { data: existing } = await admin
    .from("match_results")
    .select("home_goals, away_goals")
    .eq("match_id", matchId)
    .maybeSingle();

  if (
    existing &&
    existing.home_goals === homeGoals &&
    existing.away_goals === awayGoals
  ) {
    return false;
  }

  const { error } = await admin.from("match_results").upsert(
    {
      match_id: matchId,
      home_goals: homeGoals,
      away_goals: awayGoals,
      recorded_at: new Date().toISOString(),
    },
    { onConflict: "match_id" },
  );

  if (error) throw new Error(`match_results: ${error.message}`);
  return true;
}

export async function syncLiveMatches(
  admin: AdminClient,
  nowMs: number = Date.now(),
): Promise<SyncLiveMatchesResult> {
  const result: SyncLiveMatchesResult = {
    scanned: 0,
    updated: 0,
    markedLive: 0,
    markedFinished: 0,
    resultsPersisted: 0,
    scoresRecalculated: 0,
    poolsRebuilt: 0,
    errors: [],
  };

  if (!isBsdConfigured()) return result;

  const matches = await loadCandidateMatches(admin, nowMs);
  result.scanned = matches.length;
  if (!matches.length) return result;

  const eventMap = await loadBsdEventMap(
    admin,
    matches.map((match) => match.id),
  );
  const liveRows = await fetchBsdLiveLeagueEvents();
  const liveByEventId = new Map(liveRows.map((row) => [row.id, row]));
  const poolsToRebuild = new Set<string>();

  for (const match of matches) {
    try {
      const externalKey = eventMap.get(match.id);
      if (!externalKey) {
        if (match.status === "finished") {
          await ensureFinishedMatchScoring(admin, match.id, result, poolsToRebuild);
        }
        continue;
      }

      const eventId = Number(externalKey);
      if (!Number.isFinite(eventId)) continue;

      const bundle = await fetchBsdLiveBundle(eventId, match.home_team, match.away_team);
      const liveRow = liveByEventId.get(eventId);
      const status =
        liveRow?.status ??
        (bundle.isLive ? "inprogress" : bundle.finished ? "finished" : "notstarted");
      const isFinished = bundle.finished || isBsdEventFinished(status);

      const shouldPersist =
        isBsdEventLive(status) ||
        isFinished ||
        bundle.homeScore > 0 ||
        bundle.awayScore > 0;

      if (!shouldPersist) continue;

      const { error: upsertError } = await admin.from("match_live_state").upsert(
        {
          match_id: match.id,
          source_code: bundle.sourceCode,
          source_external_key: bundle.externalKey,
          home_score: bundle.homeScore,
          away_score: bundle.awayScore,
          time_elapsed: bundle.timeElapsed,
          finished: isFinished,
          synced_at: bundle.syncedAt,
          live_payload: bundle.payload,
        },
        { onConflict: "match_id" },
      );

      if (upsertError) {
        result.errors.push(`${match.id}: ${upsertError.message}`);
        continue;
      }

      result.updated += 1;

      if (isBsdEventLive(status) && match.status !== "live") {
        const { error: liveError } = await admin
          .from("matches")
          .update({ status: "live" })
          .eq("id", match.id);
        if (!liveError) result.markedLive += 1;
      }

      if (isFinished) {
        const resultWritten = await persistOfficialResultFromLive(
          admin,
          match.id,
          bundle.homeScore,
          bundle.awayScore,
        );
        if (resultWritten) result.resultsPersisted += 1;

        if (match.status !== "finished") {
          const { error: finishError } = await admin
            .from("matches")
            .update({ status: "finished" })
            .eq("id", match.id);
          if (!finishError) result.markedFinished += 1;
        }

        await ensureFinishedMatchScoring(admin, match.id, result, poolsToRebuild);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "sync live match";
      result.errors.push(`${match.id}: ${message}`);
    }
  }

  for (const poolId of poolsToRebuild) {
    const { error: rebuildError } = await admin.rpc("rebuild_pool_member_scores", {
      p_pool_id: poolId,
    });
    if (rebuildError) {
      result.errors.push(`${poolId}/rebuild: ${rebuildError.message}`);
      continue;
    }
    result.poolsRebuilt += 1;
  }

  return result;
}
