import { teamNamesMatch } from "@/lib/lineup/sources/api-football-names";
import {
  fetchWorldCupEventsFromBsd,
  type BsdConfirmedLineupsPayload,
} from "@/lib/lineup/sources/bsd-client";
import { BSD_SOURCE_CODE } from "@/lib/lineup/sources/bsd-constants";
import type { SupabaseClient } from "@supabase/supabase-js";

async function getBsdEventExternalKey(
  supabase: SupabaseClient,
  matchId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("external_id_map")
    .select("external_key")
    .eq("source_code", BSD_SOURCE_CODE)
    .eq("entity_type", "match")
    .eq("internal_id", matchId)
    .eq("match_status", "mapped")
    .maybeSingle();

  if (error || !data?.external_key) return null;
  return data.external_key;
}

export async function resolveBsdEventId(
  supabase: SupabaseClient,
  matchId: string,
  teamName: string,
  homeTeam: string,
  awayTeam: string,
  kickoffAt?: string
): Promise<number | null> {
  const mapped = await getBsdEventExternalKey(supabase, matchId);
  if (mapped) {
    const parsed = Number(mapped);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const { events } = await fetchWorldCupEventsFromBsd();

  for (const event of events) {
    const teamsOk =
      (teamNamesMatch(event.homeName, homeTeam) && teamNamesMatch(event.awayName, awayTeam)) ||
      (teamNamesMatch(event.homeName, awayTeam) && teamNamesMatch(event.awayName, homeTeam));
    if (!teamsOk) continue;

    if (kickoffAt) {
      const delta = Math.abs(Date.parse(kickoffAt) - Date.parse(event.kickoffIso));
      if (delta > 3 * 60 * 60 * 1000) continue;
    }

    return event.fixtureId;
  }

  return null;
}

export function pickBsdTeamSide(
  payload: BsdConfirmedLineupsPayload | { lineups?: { home?: { team_name?: string; team?: string }; away?: { team_name?: string; team?: string } } | null },
  teamName: string
): "home" | "away" | null {
  const homeName = payload.lineups?.home?.team_name ?? payload.lineups?.home?.team ?? "";
  const awayName = payload.lineups?.away?.team_name ?? payload.lineups?.away?.team ?? "";
  if (teamNamesMatch(homeName, teamName)) return "home";
  if (teamNamesMatch(awayName, teamName)) return "away";
  return null;
}
