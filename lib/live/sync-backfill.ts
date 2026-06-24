import { isBsdConfigured } from "@/lib/lineup/sources/bsd-client";
import { BSD_SOURCE_CODE } from "@/lib/lineup/sources/bsd-constants";
import { fetchBsdLiveBundle } from "@/lib/live/sources/bsd-live";
import type { MatchLivePayload, MatchPlayerIncident } from "@/lib/live/types";
import type { AdminClient } from "@/lib/scripts/supabase-admin";

type MatchRow = {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  status: string;
};

export type SyncBackfillResult = {
  scanned: number;
  updated: number;
  errors: string[];
};

function goalsMissingMinutes(incidents: MatchPlayerIncident[] | undefined): boolean {
  const goals = (incidents ?? []).filter((row) => row.kind === "goal");
  return goals.length > 0 && goals.every((row) => row.minute == null);
}

async function loadFinishedMatchesNeedingIncidentBackfill(
  admin: AdminClient,
  limit: number,
): Promise<MatchRow[]> {
  const { data, error } = await admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, status, match_live_state(live_payload)")
    .eq("status", "finished")
    // Consider adding a "backfill_completed" boolean column in the future
    .order("kickoff_at", { ascending: false })
    .limit(limit * 4);

  if (error) throw new Error(`matches backfill: ${error.message}`);

  const rows: MatchRow[] = [];
  for (const row of data ?? []) {
    const liveState = (row as {
      match_live_state: { live_payload: MatchLivePayload | null } | { live_payload: MatchLivePayload | null }[] | null;
    }).match_live_state;
    const payload = Array.isArray(liveState) ? liveState[0]?.live_payload : liveState?.live_payload;
    const incidents = (payload ?? {}).playerIncidents;
    
    if (incidents?.length && !goalsMissingMinutes(incidents)) continue;

    rows.push({
      id: row.id as string,
      home_team: row.home_team as string,
      away_team: row.away_team as string,
      kickoff_at: row.kickoff_at as string,
      status: row.status as string,
    });
    if (rows.length >= limit) break;
  }

  return rows;
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

export async function syncBackfill(admin: AdminClient): Promise<SyncBackfillResult> {
  const result: SyncBackfillResult = {
    scanned: 0,
    updated: 0,
    errors: [],
  };

  if (!isBsdConfigured()) return result;

  const matches = await loadFinishedMatchesNeedingIncidentBackfill(admin, 12);
  result.scanned = matches.length;

  if (!matches.length) return result;

  const eventMap = await loadBsdEventMap(
    admin,
    matches.map((match) => match.id),
  );

  const updates = await Promise.allSettled(
    matches.map(async (match) => {
      const externalKey = eventMap.get(match.id);
      if (!externalKey) return;

      const eventId = Number(externalKey);
      if (!Number.isFinite(eventId)) return;

      const bundle = await fetchBsdLiveBundle(eventId, match.home_team, match.away_team);

      if (bundle.homeScore > 0 || bundle.awayScore > 0 || bundle.finished) {
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
          throw new Error(`${match.id}: ${upsertError.message}`);
        }
        return true;
      }
      return false;
    })
  );

  for (const update of updates) {
    if (update.status === "rejected") {
      result.errors.push(update.reason instanceof Error ? update.reason.message : String(update.reason));
    } else if (update.value) {
      result.updated += 1;
    }
  }

  return result;
}
