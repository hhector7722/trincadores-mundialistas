import {
  fetchBsdConfirmedLineups,
  isBsdConfigured,
} from "@/lib/lineup/sources/bsd-client";
import { resolveBsdEventId, pickBsdTeamSide } from "@/lib/lineup/sources/bsd-event-lookup";
import { parseBsdConfirmedTeamLineup } from "@/lib/lineup/sources/bsd-lineup-parse";
import type { ConfirmedLineupProvider, LineupFetchParams } from "@/lib/lineup/sources/types";
import type { ResolvedLineup } from "@/lib/lineup/types";

async function loadMatchTeams(supabase: LineupFetchParams["supabase"], matchId: string) {
  const { data } = await supabase
    .from("matches")
    .select("home_team, away_team, kickoff_at")
    .eq("id", matchId)
    .maybeSingle();
  return data;
}

export async function fetchConfirmedLineupFromBsd(
  params: LineupFetchParams
): Promise<ResolvedLineup | null> {
  if (!isBsdConfigured()) return null;

  const match = await loadMatchTeams(params.supabase, params.matchId);
  if (!match) return null;

  const eventId = await resolveBsdEventId(
    params.supabase,
    params.matchId,
    params.teamName,
    match.home_team,
    match.away_team,
    match.kickoff_at
  );
  if (!eventId) return null;

  const payload = await fetchBsdConfirmedLineups(eventId);
  if (!payload || payload.lineup_status !== "confirmed" || !payload.lineups) {
    return null;
  }

  const side = pickBsdTeamSide(payload, params.teamName);
  if (!side) return null;

  const teamPayload = payload.lineups[side];
  if (!teamPayload) return null;

  return parseBsdConfirmedTeamLineup(
    teamPayload,
    params.players,
    payload.updated_at ?? new Date().toISOString()
  );
}

export const bsdConfirmedProvider: ConfirmedLineupProvider = {
  code: "bsd",
  fetchConfirmedLineup: fetchConfirmedLineupFromBsd,
};
