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
  errors: string[];
};

async function loadCandidateMatches(admin: AdminClient, nowMs: number): Promise<MatchRow[]> {
  const fromIso = new Date(nowMs - 3 * 60 * 60 * 1000).toISOString();
  const toIso = new Date(nowMs + 30 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, status")
    .in("status", ["scheduled", "live"])
    .gte("kickoff_at", fromIso)
    .lte("kickoff_at", toIso);

  if (error) throw new Error(`matches: ${error.message}`);
  return data ?? [];
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

export async function syncLiveMatches(
  admin: AdminClient,
  nowMs: number = Date.now(),
): Promise<SyncLiveMatchesResult> {
  const result: SyncLiveMatchesResult = {
    scanned: 0,
    updated: 0,
    markedLive: 0,
    markedFinished: 0,
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

  for (const match of matches) {
    try {
      const externalKey = eventMap.get(match.id);
      if (!externalKey) continue;

      const eventId = Number(externalKey);
      if (!Number.isFinite(eventId)) continue;

      const bundle = await fetchBsdLiveBundle(eventId, match.home_team, match.away_team);
      const liveRow = liveByEventId.get(eventId);
      const status = liveRow?.status ?? (bundle.isLive ? "inprogress" : bundle.finished ? "finished" : "notstarted");

      const shouldPersist =
        isBsdEventLive(status) ||
        isBsdEventFinished(status) ||
        (bundle.homeScore > 0 || bundle.awayScore > 0);

      if (!shouldPersist) continue;

      const { error: upsertError } = await admin.from("match_live_state").upsert(
        {
          match_id: match.id,
          source_code: bundle.sourceCode,
          source_external_key: bundle.externalKey,
          home_score: bundle.homeScore,
          away_score: bundle.awayScore,
          time_elapsed: bundle.timeElapsed,
          finished: bundle.finished,
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

      if (bundle.finished && match.status !== "finished") {
        const { error: finishError } = await admin
          .from("matches")
          .update({ status: "finished" })
          .eq("id", match.id);
        if (!finishError) result.markedFinished += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "sync live match";
      result.errors.push(`${match.id}: ${message}`);
    }
  }

  return result;
}
