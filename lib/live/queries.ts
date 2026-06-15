import type { MatchLivePayload, MatchLiveSnapshot } from "@/lib/live/types";
import { formatBsdMinuteLabel } from "@/lib/live/sources/bsd-live";
import type { SupabaseClient } from "@supabase/supabase-js";

type LiveStateRow = {
  match_id: string;
  home_score: number;
  away_score: number;
  time_elapsed: string;
  finished: boolean;
  synced_at: string;
  live_payload: MatchLivePayload | null;
};

function payloadFromRow(row: LiveStateRow): MatchLivePayload {
  return (row.live_payload ?? {}) as MatchLivePayload;
}

function normalizeMinuteLabel(label: string): string {
  if (label.trim().toLowerCase() === "descanso") return "Desc";
  return label;
}

export function rowToMatchLiveSnapshot(row: LiveStateRow): MatchLiveSnapshot {
  const payload = payloadFromRow(row);
  const minuteLabel = normalizeMinuteLabel(
    row.time_elapsed && row.time_elapsed !== "notstarted"
      ? row.time_elapsed
      : formatBsdMinuteLabel({
          current_minute: payload.currentMinute ?? null,
          period: payload.period ?? null,
          status: row.finished ? "finished" : "inprogress",
        })
  );

  return {
    matchId: row.match_id,
    homeScore: row.home_score,
    awayScore: row.away_score,
    minuteLabel,
    finished: row.finished,
    stats: payload.stats ?? null,
    substitutions: payload.substitutions ?? [],
    playerIncidents: payload.playerIncidents ?? [],
    syncedAt: row.synced_at,
  };
}

export async function loadMatchLiveSnapshot(
  supabase: SupabaseClient,
  matchId: string,
): Promise<MatchLiveSnapshot | null> {
  const { data, error } = await supabase
    .from("match_live_state")
    .select("match_id, home_score, away_score, time_elapsed, finished, synced_at, live_payload")
    .eq("match_id", matchId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToMatchLiveSnapshot(data as LiveStateRow);
}

export async function loadLiveSnapshotsForMatches(
  supabase: SupabaseClient,
  matchIds: string[],
): Promise<Map<string, MatchLiveSnapshot>> {
  if (!matchIds.length) return new Map();

  const { data, error } = await supabase
    .from("match_live_state")
    .select("match_id, home_score, away_score, time_elapsed, finished, synced_at, live_payload")
    .in("match_id", matchIds);

  if (error || !data?.length) return new Map();

  return new Map(
    (data as LiveStateRow[]).map((row) => [row.match_id, rowToMatchLiveSnapshot(row)]),
  );
}
