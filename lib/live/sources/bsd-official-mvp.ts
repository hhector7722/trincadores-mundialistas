/**
 * MVP oficial desde BSD solo si el feed declara el premio de forma explícita.
 */

import { getBsdApiKey, isBsdConfigured } from "@/lib/lineup/sources/bsd-client";
import { titleCasePlayerName } from "@/lib/worldcup2026/fifa-squads";

const BSD_API_BASE = "https://sports.bzzoiro.com";

const EXPLICIT_BSD_INCIDENT_TYPES = new Set([
  "man_of_the_match",
  "player_of_the_match",
  "player_of_match",
  "mvp",
  "potm",
]);

export type OfficialMvpFromBsd = {
  playerName: string;
  teamName: string;
  sourceCode: "bsd";
  sourceExternalKey: string;
  signal: "incident" | "event_field";
};

type BsdIncident = {
  type?: string;
  player?: string;
  player_name?: string;
  team?: string;
  is_home?: boolean;
};

type BsdIncidentsResponse = {
  incidents?: BsdIncident[];
};

type BsdEventDetail = {
  man_of_the_match?: string;
  player_of_the_match?: string;
  mvp?: string;
  potm?: string;
};

async function bsdFetch<T>(path: string): Promise<T | null> {
  const apiKey = getBsdApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(`${BSD_API_BASE}${path}`, {
      headers: { Authorization: `Token ${apiKey}` },
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function normalizeName(raw: string): string {
  return titleCasePlayerName(raw.trim());
}

function teamFromSide(isHome: boolean | undefined, homeTeam: string, awayTeam: string): string {
  return isHome === false ? awayTeam : homeTeam;
}

export function parseOfficialMvpFromBsdIncidents(
  payload: BsdIncidentsResponse | null,
  homeTeam: string,
  awayTeam: string,
): OfficialMvpFromBsd | null {
  for (const incident of payload?.incidents ?? []) {
    const type = incident.type?.trim().toLowerCase();
    if (!type || !EXPLICIT_BSD_INCIDENT_TYPES.has(type)) continue;

    const player = incident.player_name?.trim() || incident.player?.trim();
    if (!player) continue;

    return {
      playerName: normalizeName(player),
      teamName: incident.team?.trim() || teamFromSide(incident.is_home, homeTeam, awayTeam),
      sourceCode: "bsd",
      sourceExternalKey: type,
      signal: "incident",
    };
  }
  return null;
}

export function parseOfficialMvpFromBsdEventDetail(
  payload: BsdEventDetail | null,
  homeTeam: string,
  awayTeam: string,
): OfficialMvpFromBsd | null {
  if (!payload) return null;

  const player =
    payload.man_of_the_match?.trim() ||
    payload.player_of_the_match?.trim() ||
    payload.mvp?.trim() ||
    payload.potm?.trim();

  if (!player) return null;

  return {
    playerName: normalizeName(player),
    teamName: homeTeam,
    sourceCode: "bsd",
    sourceExternalKey: "event_detail",
    signal: "event_field",
  };
}

export async function fetchOfficialMvpFromBsd(
  eventId: number,
  homeTeam: string,
  awayTeam: string,
): Promise<OfficialMvpFromBsd | null> {
  if (!isBsdConfigured()) return null;

  const [incidents, detail] = await Promise.all([
    bsdFetch<BsdIncidentsResponse>(`/api/v2/events/${eventId}/incidents/`),
    bsdFetch<BsdEventDetail>(`/api/v2/events/${eventId}/`),
  ]);

  return (
    parseOfficialMvpFromBsdIncidents(incidents, homeTeam, awayTeam) ??
    parseOfficialMvpFromBsdEventDetail(detail, homeTeam, awayTeam)
  );
}
