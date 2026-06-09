import {
  BSD_API_BASE_URL,
  BSD_WC_LEAGUE_ID,
  BSD_WC_SEASON_ID,
} from "@/lib/lineup/sources/bsd-constants";
import type { ApiFootballFixtureRef } from "@/lib/lineup/sources/api-football-match-mapper";

export type BsdEventRef = ApiFootballFixtureRef & {
  seasonId: number | null;
  groupName: string | null;
};

type BsdEventsResponse = {
  count?: number;
  results?: Array<{
    id?: number;
    event_date?: string;
    home_team?: string;
    away_team?: string;
    home_team_id?: number;
    away_team_id?: number;
    season_id?: number | null;
    group_name?: string | null;
  }>;
};

export function getBsdApiKey(): string | null {
  return process.env.BSD_API_KEY?.trim() || null;
}

export function isBsdConfigured(): boolean {
  return Boolean(getBsdApiKey());
}

async function bsdFetch<T>(path: string): Promise<T | null> {
  const apiKey = getBsdApiKey();
  if (!apiKey) return null;

  const url = path.startsWith("http") ? path : `${BSD_API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { Authorization: `Token ${apiKey}` },
    next: { revalidate: 300 },
  });

  if (!response.ok) return null;
  return (await response.json()) as T;
}

function parseEventRows(payload: BsdEventsResponse): BsdEventRef[] {
  return (payload.results ?? [])
    .filter((row) => row.id && row.event_date && row.home_team && row.away_team)
    .map((row) => ({
      fixtureId: row.id!,
      kickoffIso: row.event_date!,
      homeName: row.home_team!,
      awayName: row.away_team!,
      homeTeamId: row.home_team_id ?? null,
      awayTeamId: row.away_team_id ?? null,
      seasonId: row.season_id ?? null,
      groupName: row.group_name ?? null,
    }));
}

export async function fetchWorldCupEventsFromBsd(): Promise<{
  events: BsdEventRef[];
  requests: number;
}> {
  const payload = await bsdFetch<BsdEventsResponse>(
    `/api/v2/events/?league_id=${BSD_WC_LEAGUE_ID}&limit=250`
  );
  if (!payload) {
    return { events: [], requests: 1 };
  }

  const events = parseEventRows(payload).filter(
    (event) => event.seasonId === BSD_WC_SEASON_ID
  );
  return { events, requests: 1 };
}

export type BsdConfirmedLineupsPayload = {
  event_id?: number;
  lineup_status?: string;
  lineups?: {
    home?: BsdConfirmedTeamLineup;
    away?: BsdConfirmedTeamLineup;
  } | null;
  updated_at?: string | null;
};

export type BsdConfirmedPlayer = {
  name?: string;
  short_name?: string;
  position?: string;
  jersey_number?: number | null;
};

export type BsdConfirmedTeamLineup = {
  team_name?: string;
  formation?: string | null;
  players?: BsdConfirmedPlayer[];
  substitutes?: BsdConfirmedPlayer[];
};

export async function fetchBsdConfirmedLineups(
  eventId: number
): Promise<BsdConfirmedLineupsPayload | null> {
  return bsdFetch<BsdConfirmedLineupsPayload>(`/api/v2/events/${eventId}/lineups/`);
}

export type BsdPredictedPlayer = {
  name?: string;
  jersey_number?: number | null;
  position?: string | null;
  predicted_slot?: string | null;
  availability?: string | null;
};

export type BsdPredictedTeamLineup = {
  team?: string;
  predicted_formation?: string | null;
  confidence?: number | null;
  starters?: BsdPredictedPlayer[];
  substitutes?: BsdPredictedPlayer[];
  unavailable?: BsdPredictedPlayer[];
  updated_at?: string | null;
};

export type BsdPredictedLineupsPayload = {
  event?: {
    id?: number;
    home_team?: string;
    away_team?: string;
    date?: string;
  };
  lineups?: {
    home?: BsdPredictedTeamLineup;
    away?: BsdPredictedTeamLineup;
  } | null;
  error?: string;
};

export async function fetchBsdPredictedLineup(
  eventId: number
): Promise<BsdPredictedLineupsPayload | null> {
  return bsdFetch<BsdPredictedLineupsPayload>(`/api/predicted-lineup/${eventId}/`);
}
