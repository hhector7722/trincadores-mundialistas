export const THE_ODDS_API_BASE_URL = "https://api.the-odds-api.com";
export const THE_ODDS_WC_SPORT_KEY = "soccer_fifa_world_cup_winner";

export function getTheOddsApiKey(): string | null {
  return process.env.THE_ODDS_API_KEY?.trim() || null;
}

export function isTheOddsApiConfigured(): boolean {
  return Boolean(getTheOddsApiKey());
}

export const ODDS_FETCH_TIMEOUT_MS = 10_000;

export type TheOddsOutrightMarket = "outrights";

export type TheOddsOutcome = {
  name: string;
  price: number;
};

export type TheOddsMarket = {
  key: string;
  last_update: string;
  outcomes: TheOddsOutcome[];
};

export type TheOddsBookmaker = {
  key: string;
  title: string;
  last_update: string;
  markets: TheOddsMarket[];
};

export type TheOddsEvent = {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string | null;
  away_team: string | null;
  bookmakers: TheOddsBookmaker[];
};

async function oddsFetch<T>(path: string): Promise<T | null> {
  const apiKey = getTheOddsApiKey();
  if (!apiKey) {
    console.warn("[odds] Missing THE_ODDS_API_KEY");
    return null;
  }

  const url = new URL(path.startsWith("http") ? path : `${THE_ODDS_API_BASE_URL}${path}`);
  url.searchParams.set("apiKey", apiKey);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ODDS_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      // Revalidate in 1 hour since outrights don't change by the second,
      // but in cron we usually want fresh data, so no-store might be better for sync scripts.
      cache: "no-store", 
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[odds] HTTP ${response.status} ${text}`);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("[odds] fetch timeout", path);
    } else {
      console.error("[odds] fetch error", error);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Obtiene los outrights (ganador del torneo, pichichi, etc.) para el Mundial.
 * @param regions 'eu' | 'us' | 'uk' | 'au'
 */
export async function fetchWorldCupOutrights(regions = "eu"): Promise<TheOddsEvent[] | null> {
  const path = `/v4/sports/${THE_ODDS_WC_SPORT_KEY}/odds/?regions=${regions}&markets=outrights`;
  return oddsFetch<TheOddsEvent[]>(path);
}
