import {
  API_FOOTBALL_BASE_URL,
  API_FOOTBALL_WC_LEAGUE_ID,
  API_FOOTBALL_WC_SEASON,
} from "@/lib/lineup/sources/api-football-constants";
import type { ApiFootballFixtureRef } from "@/lib/lineup/sources/api-football-match-mapper";

type ApiFootballFixtureResponse = {
  response?: Array<{
    fixture?: { id?: number; date?: string };
    teams?: {
      home?: { id?: number; name?: string };
      away?: { id?: number; name?: string };
    };
  }>;
  paging?: { current?: number; total?: number };
  errors?: Record<string, string>;
};

export function getApiFootballKey(): string | null {
  const key = process.env.API_FOOTBALL_KEY?.trim();
  return key || null;
}

export function isApiFootballConfigured(): boolean {
  return Boolean(getApiFootballKey());
}

function parseFixtureRows(payload: ApiFootballFixtureResponse): ApiFootballFixtureRef[] {
  const rows: ApiFootballFixtureRef[] = [];
  for (const item of payload.response ?? []) {
    const fixtureId = item.fixture?.id;
    const kickoffIso = item.fixture?.date;
    const homeName = item.teams?.home?.name;
    const awayName = item.teams?.away?.name;
    if (!fixtureId || !kickoffIso || !homeName || !awayName) continue;
    rows.push({
      fixtureId,
      kickoffIso,
      homeName,
      awayName,
      homeTeamId: item.teams?.home?.id ?? null,
      awayTeamId: item.teams?.away?.id ?? null,
    });
  }
  return rows;
}

export async function fetchWorldCupFixturesFromApiFootball(): Promise<{
  fixtures: ApiFootballFixtureRef[];
  requests: number;
}> {
  const apiKey = getApiFootballKey();
  if (!apiKey) {
    throw new Error("Falta API_FOOTBALL_KEY en el entorno.");
  }

  const fixtures: ApiFootballFixtureRef[] = [];
  let page = 1;
  let totalPages = 1;
  let requests = 0;

  while (page <= totalPages) {
    const url = new URL(`${API_FOOTBALL_BASE_URL}/fixtures`);
    url.searchParams.set("league", String(API_FOOTBALL_WC_LEAGUE_ID));
    url.searchParams.set("season", String(API_FOOTBALL_WC_SEASON));
    url.searchParams.set("page", String(page));

    const response = await fetch(url, {
      headers: { "x-apisports-key": apiKey },
    });
    requests += 1;

    if (!response.ok) {
      throw new Error(`API-Football fixtures HTTP ${response.status}`);
    }

    const json = (await response.json()) as ApiFootballFixtureResponse;
    if (json.errors && Object.keys(json.errors).length > 0) {
      throw new Error(`API-Football error: ${JSON.stringify(json.errors)}`);
    }

    fixtures.push(...parseFixtureRows(json));
    totalPages = json.paging?.total ?? 1;
    page += 1;
  }

  return { fixtures, requests };
}
