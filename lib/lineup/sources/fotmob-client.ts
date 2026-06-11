import {
  FOTMOB_SOURCE_CODE,
  loadFotmobMatchesForDate,
  resolveFotmobMatchId,
  type FotMobMatchListItem,
} from "@/lib/live/sources/fotmob-official-mvp";
import type { SupabaseClient } from "@supabase/supabase-js";

export { FOTMOB_SOURCE_CODE };

const FOTMOB_API = "https://www.fotmob.com/api";

function kickoffDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export type FotMobLayoutCoord = {
  x?: number;
  y?: number;
};

export type FotMobLineupPlayer = {
  id?: number;
  name?: string;
  shirtNumber?: string | number;
  positionId?: number;
  usualPlayingPositionId?: number;
  horizontalLayout?: FotMobLayoutCoord;
  verticalLayout?: FotMobLayoutCoord;
};

export type FotMobLineupTeam = {
  id?: number;
  name?: string;
  formation?: string | null;
  starters?: FotMobLineupPlayer[];
  subs?: FotMobLineupPlayer[];
};

export type FotMobPlayerOfTheMatch = {
  name?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
  };
  teamName?: string;
};

export type FotMobMatchDetailsPayload = {
  content?: {
    lineup?: {
      lineupType?: string;
      source?: string;
      homeTeam?: FotMobLineupTeam;
      awayTeam?: FotMobLineupTeam;
    };
    matchFacts?: {
      playerOfTheMatch?: FotMobPlayerOfTheMatch;
    };
  };
};

async function getFotmobMatchExternalKey(
  supabase: SupabaseClient,
  matchId: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from("external_id_map")
    .select("external_key")
    .eq("source_code", FOTMOB_SOURCE_CODE)
    .eq("entity_type", "match")
    .eq("internal_id", matchId)
    .eq("match_status", "mapped")
    .maybeSingle();

  if (error || !data?.external_key) return null;

  const parsed = Number(data.external_key);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchFotmobMatchDetails(
  fotmobMatchId: number
): Promise<FotMobMatchDetailsPayload | null> {
  const response = await fetch(`${FOTMOB_API}/data/matchDetails?matchId=${fotmobMatchId}`, {
    headers: { "user-agent": "TrincadoresMundialistas/1.0" },
    signal: AbortSignal.timeout(25_000),
    cache: "no-store",
  });

  if (!response.ok) return null;

  return (await response.json()) as FotMobMatchDetailsPayload;
}

export async function resolveFotmobMatchIdForInternalMatch(
  supabase: SupabaseClient,
  matchId: string,
  homeTeam: string,
  awayTeam: string,
  kickoffAt: string,
  cachedRowsByDate?: Map<string, FotMobMatchListItem[]>
): Promise<number | null> {
  const mapped = await getFotmobMatchExternalKey(supabase, matchId);
  if (mapped) return mapped;

  const dateKey = kickoffDateKey(kickoffAt);
  if (!dateKey) return null;

  let rows = cachedRowsByDate?.get(dateKey);
  if (!rows) {
    rows = await loadFotmobMatchesForDate(dateKey);
    cachedRowsByDate?.set(dateKey, rows);
  }

  return resolveFotmobMatchId(rows, homeTeam, awayTeam);
}
