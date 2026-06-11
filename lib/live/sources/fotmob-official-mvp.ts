/**
 * MVP de partido vía FotMob (`content.matchFacts.playerOfTheMatch`).
 *
 * Alcance: en partidos del Mundial, FotMob publica aquí el Player of the Match
 * de FIFA (no el jugador con mejor nota). En otras competiciones FotMob puede
 * usar lógica distinta; esta porra solo consume Mundiales, donde el campo es
 * fiable cuando está poblado.
 *
 * No se infiere por rating ni por `topPlayers`: solo el objeto dedicado
 * `playerOfTheMatch`.
 */

import { titleCasePlayerName } from "@/lib/worldcup2026/fifa-squads";
import { openFootballTeamName } from "@/lib/worldcup2026/squad-team-names";

export const FOTMOB_SOURCE_CODE = "fotmob";

const FOTMOB_API = "https://www.fotmob.com/api";

type FotMobSide = {
  name?: string;
  longName?: string;
};

export type FotMobMatchListItem = {
  id?: number;
  home?: FotMobSide;
  away?: FotMobSide;
  status?: { utcTime?: string };
};

type FotMobPlayerOfTheMatch = {
  name?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
  };
  teamName?: string;
};

export type OfficialMvpFromFotmob = {
  playerName: string;
  teamName: string;
  sourceCode: typeof FOTMOB_SOURCE_CODE;
  sourceExternalKey: string;
  signal: "player_of_the_match";
};

function kickoffDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function canonicalTeamLabel(name: string): string {
  return openFootballTeamName(name).trim().toLowerCase();
}

function teamMatches(candidate: string | undefined, expected: string): boolean {
  if (!candidate?.trim()) return false;
  return canonicalTeamLabel(candidate) === canonicalTeamLabel(expected);
}

export function canonicalStoredPlayerName(raw: string): string {
  const ascii = raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
  return titleCasePlayerName(ascii);
}

export function resolveFotmobMatchId(
  rows: FotMobMatchListItem[],
  homeTeam: string,
  awayTeam: string,
): number | null {
  for (const row of rows) {
    const id = row.id;
    if (!id) continue;

    const homeHit =
      teamMatches(row.home?.longName, homeTeam) || teamMatches(row.home?.name, homeTeam);
    const awayHit =
      teamMatches(row.away?.longName, awayTeam) || teamMatches(row.away?.name, awayTeam);

    if (homeHit && awayHit) return id;
  }
  return null;
}

export async function loadFotmobMatchesForDate(dateKey: string): Promise<FotMobMatchListItem[]> {
  const response = await fetch(
    `${FOTMOB_API}/data/matches?date=${dateKey.replace(/-/g, "")}&timezone=UTC`,
    {
      headers: { "user-agent": "TrincadoresMundialistas/1.0" },
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`FotMob matches ${dateKey}: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    leagues?: Array<{ matches?: FotMobMatchListItem[] }>;
  };

  const rows: FotMobMatchListItem[] = [];
  for (const league of payload.leagues ?? []) {
    rows.push(...(league.matches ?? []));
  }
  return rows;
}

export function parseOfficialMvpFromFotmobDetails(
  payload: { content?: { matchFacts?: { playerOfTheMatch?: FotMobPlayerOfTheMatch } } },
  fallbackHomeTeam: string,
): OfficialMvpFromFotmob | null {
  const potm = payload.content?.matchFacts?.playerOfTheMatch;
  if (!potm) return null;

  const rawName =
    potm.name?.fullName?.trim() ||
    [potm.name?.firstName, potm.name?.lastName].filter(Boolean).join(" ").trim();

  if (!rawName) return null;

  const teamName = potm.teamName?.trim() || fallbackHomeTeam;

  return {
    playerName: canonicalStoredPlayerName(rawName),
    teamName: openFootballTeamName(teamName),
    sourceCode: FOTMOB_SOURCE_CODE,
    sourceExternalKey: "playerOfTheMatch",
    signal: "player_of_the_match",
  };
}

export async function fetchOfficialMvpFromFotmob(
  fotmobMatchId: number,
  homeTeam: string,
): Promise<OfficialMvpFromFotmob | null> {
  const response = await fetch(`${FOTMOB_API}/data/matchDetails?matchId=${fotmobMatchId}`, {
    headers: { "user-agent": "TrincadoresMundialistas/1.0" },
    signal: AbortSignal.timeout(25_000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`FotMob matchDetails ${fotmobMatchId}: HTTP ${response.status}`);
  }

  const payload = await response.json();
  return parseOfficialMvpFromFotmobDetails(payload, homeTeam);
}

export async function fetchOfficialMvpFromFotmobByTeams(
  homeTeam: string,
  awayTeam: string,
  kickoffAt: string,
  cachedRows?: FotMobMatchListItem[],
): Promise<OfficialMvpFromFotmob | null> {
  const dateKey = kickoffDateKey(kickoffAt);
  if (!dateKey) return null;

  const rows = cachedRows ?? (await loadFotmobMatchesForDate(dateKey));
  const fotmobMatchId = resolveFotmobMatchId(rows, homeTeam, awayTeam);
  if (!fotmobMatchId) return null;

  return fetchOfficialMvpFromFotmob(fotmobMatchId, homeTeam);
}
