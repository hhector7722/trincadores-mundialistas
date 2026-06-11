import {
  BSD_SOURCE_CODE,
  BSD_WC_LEAGUE_ID,
} from "@/lib/lineup/sources/bsd-constants";
import { getBsdApiKey, isBsdConfigured } from "@/lib/lineup/sources/bsd-client";
import type { MatchLivePayload, MatchLiveStats, MatchSubstitution } from "@/lib/live/types";

const BSD_API_BASE = "https://sports.bzzoiro.com";

export type BsdLiveEventRow = {
  id?: number;
  home_team?: string;
  away_team?: string;
  home_score?: number;
  away_score?: number;
  current_minute?: number | null;
  status?: string;
  period?: string | null;
  last_updated?: string;
};

type BsdLiveEventsResponse = {
  count?: number;
  events?: BsdLiveEventRow[];
};

type BsdEventDetail = BsdLiveEventRow & {
  event_date?: string;
};

type BsdStatValue = number | { value?: number; total?: number; pct?: number } | { actual?: number };

type BsdStatsResponse = {
  stats?: {
    home?: Record<string, BsdStatValue>;
    away?: Record<string, BsdStatValue>;
  };
};

type BsdIncident = {
  type?: string;
  minute?: number | string | null;
  is_home?: boolean;
  player_in?: string;
  player_out?: string;
  card_type?: string;
};

type BsdIncidentsResponse = {
  incidents?: BsdIncident[];
};

async function bsdLiveFetch<T>(path: string): Promise<T | null> {
  const apiKey = getBsdApiKey();
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(`${BSD_API_BASE}${path}`, {
      headers: { Authorization: `Token ${apiKey}` },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function readCounter(value: BsdStatValue | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "object" && "value" in value && typeof value.value === "number") {
    return value.value;
  }
  return null;
}

function readXg(value: BsdStatValue | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "object" && "actual" in value && typeof value.actual === "number") {
    return value.actual;
  }
  return null;
}

export function parseBsdStats(payload: BsdStatsResponse | null): MatchLiveStats | null {
  const home = payload?.stats?.home;
  const away = payload?.stats?.away;
  if (!home && !away) return null;

  return {
    possessionHome: readCounter(home?.ball_possession),
    possessionAway: readCounter(away?.ball_possession),
    shotsHome: readCounter(home?.total_shots),
    shotsAway: readCounter(away?.total_shots),
    shotsOnTargetHome: readCounter(home?.shots_on_target),
    shotsOnTargetAway: readCounter(away?.shots_on_target),
    xgHome: readXg(home?.xg),
    xgAway: readXg(away?.xg),
    yellowCardsHome: readCounter(home?.yellow_cards),
    yellowCardsAway: readCounter(away?.yellow_cards),
    redCardsHome: readCounter(home?.red_cards),
    redCardsAway: readCounter(away?.red_cards),
  };
}

export function parseBsdSubstitutions(
  payload: BsdIncidentsResponse | null,
  homeTeam: string,
  awayTeam: string,
): MatchSubstitution[] {
  const rows: MatchSubstitution[] = [];

  for (const incident of payload?.incidents ?? []) {
    if (incident.type !== "substitution") continue;
    const playerIn = incident.player_in?.trim();
    const playerOut = incident.player_out?.trim();
    if (!playerIn && !playerOut) continue;

    rows.push({
      minute: incident.minute != null ? String(incident.minute) : "—",
      teamSide: incident.is_home === false ? "away" : "home",
      playerIn: playerIn ?? "—",
      playerOut: playerOut ?? "—",
    });
  }

  return rows;
}

export function formatBsdMinuteLabel(
  detail: Pick<BsdEventDetail, "current_minute" | "period" | "status"> | null,
): string {
  if (!detail) return "—";
  if (detail.period === "halftime" || detail.period === "HT") return "Descanso";
  if (detail.period === "FT" || detail.status === "finished") return "Final";
  if (detail.current_minute != null && detail.current_minute > 0) {
    return `${detail.current_minute}'`;
  }
  if (detail.period === "1st_half") return "1ª parte";
  if (detail.period === "2nd_half") return "2ª parte";
  if (detail.status === "inprogress") return "En juego";
  return "—";
}

export function isBsdEventLive(status: string | undefined): boolean {
  return status === "inprogress" || status === "penalties";
}

export function isBsdEventFinished(status: string | undefined): boolean {
  return status === "finished";
}

export async function fetchBsdLiveLeagueEvents(): Promise<BsdLiveEventRow[]> {
  if (!isBsdConfigured()) return [];
  const payload = await bsdLiveFetch<BsdLiveEventsResponse>(
    `/api/v2/events/live/?league_id=${BSD_WC_LEAGUE_ID}`,
  );
  return payload?.events ?? [];
}

export async function fetchBsdEventDetail(eventId: number): Promise<BsdEventDetail | null> {
  return bsdLiveFetch<BsdEventDetail>(`/api/v2/events/${eventId}/`);
}

export async function fetchBsdEventStats(eventId: number): Promise<BsdStatsResponse | null> {
  return bsdLiveFetch<BsdStatsResponse>(`/api/v2/events/${eventId}/stats/`);
}

export async function fetchBsdEventIncidents(eventId: number): Promise<BsdIncidentsResponse | null> {
  return bsdLiveFetch<BsdIncidentsResponse>(`/api/v2/events/${eventId}/incidents/`);
}

export async function fetchBsdLiveBundle(eventId: number, homeTeam: string, awayTeam: string) {
  const [detail, stats, incidents] = await Promise.all([
    fetchBsdEventDetail(eventId),
    fetchBsdEventStats(eventId),
    fetchBsdEventIncidents(eventId),
  ]);

  const parsedStats = parseBsdStats(stats);
  const substitutions = parseBsdSubstitutions(incidents, homeTeam, awayTeam);
  const payload: MatchLivePayload = {
    period: detail?.period ?? null,
    currentMinute: detail?.current_minute ?? null,
    stats: parsedStats,
    substitutions,
  };

  return {
    sourceCode: BSD_SOURCE_CODE,
    externalKey: String(eventId),
    homeScore: detail?.home_score ?? 0,
    awayScore: detail?.away_score ?? 0,
    timeElapsed: formatBsdMinuteLabel(detail),
    finished: isBsdEventFinished(detail?.status),
    isLive: isBsdEventLive(detail?.status),
    payload,
    syncedAt: detail?.last_updated ?? new Date().toISOString(),
  };
}
