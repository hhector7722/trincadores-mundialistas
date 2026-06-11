/**
 * MVP oficial de partido desde API FIFA (api.fifa.com).
 * Solo señales explícitas: timeline, campos dedicados o incidentes nombrados.
 * No se infiere por ratings, stats ni heurísticas de SpecialStatus.
 */

import { titleCasePlayerName } from "@/lib/worldcup2026/fifa-squads";
import {
  fifaCodeFromOpenFootball,
  openFootballNameFromFifaCode,
} from "@/lib/worldcup2026/squad-team-names";

export const FIFA_WC_SOURCE_CODE = "fifa";

const DEFAULT_BASE = "https://api.fifa.com/api/v3";
const DEFAULT_COMPETITION = "17";
const DEFAULT_SEASON = "285023";

const EXPLICIT_MVP_KEY = /playerof(the)?match|manofthematch|superiorplayer|budweiserplayer/i;

const EXPLICIT_MVP_LABEL =
  /player of the match|man of the match|superior player|budweiser player/i;

type Localized = Array<{ Locale?: string; Description?: string }>;

export type FifaResolvedMatch = {
  idMatch: string;
  idStage: string;
  idSeason: string;
  idCompetition: string;
  homeCode: string;
  awayCode: string;
};

export type OfficialMvpFromFifa = {
  playerName: string;
  teamName: string;
  sourceCode: typeof FIFA_WC_SOURCE_CODE;
  sourceExternalKey: string;
  signal: "timeline" | "live_field" | "calendar_field";
};

type CalendarMatch = {
  IdMatch?: string;
  IdStage?: string;
  IdSeason?: string;
  IdCompetition?: string;
  Date?: string;
  Home?: { Abbreviation?: string; IdCountry?: string };
  Away?: { Abbreviation?: string; IdCountry?: string };
};

type FifaPlayer = {
  IdPlayer?: string;
  IdTeam?: string;
  PlayerName?: Localized;
  ShortName?: Localized;
};

function loc(items?: Localized | null): string | null {
  if (!items?.length) return null;
  const en = items.find((e) => e.Locale === "en-GB") ?? items[0];
  return en.Description?.trim() ?? null;
}

function fifaBase(): string {
  return (process.env.FIFA_API_BASE_URL?.trim() || DEFAULT_BASE).replace(/\/+$/, "");
}

function fifaSeason(): string {
  return process.env.FIFA_SEASON_ID?.trim() || DEFAULT_SEASON;
}

async function fifaFetch(path: string): Promise<unknown> {
  const res = await fetch(`${fifaBase()}${path}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`FIFA API ${path}: HTTP ${res.status}`);
  }
  return res.json();
}

function kickoffDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function teamCode(team?: { Abbreviation?: string; IdCountry?: string }): string {
  return (team?.Abbreviation ?? team?.IdCountry ?? "").trim().toUpperCase();
}

export function buildFifaCalendarLookup(
  rows: CalendarMatch[],
): Map<string, FifaResolvedMatch> {
  const lookup = new Map<string, FifaResolvedMatch>();

  for (const row of rows) {
    const idMatch = row.IdMatch?.trim();
    const idStage = row.IdStage?.trim();
    if (!idMatch || !idStage || !row.Date) continue;

    const homeCode = teamCode(row.Home);
    const awayCode = teamCode(row.Away);
    if (!homeCode || !awayCode) continue;

    const dateKey = kickoffDateKey(row.Date);
    if (!dateKey) continue;

    const resolved: FifaResolvedMatch = {
      idMatch,
      idStage,
      idSeason: row.IdSeason?.trim() || fifaSeason(),
      idCompetition: row.IdCompetition?.trim() || DEFAULT_COMPETITION,
      homeCode,
      awayCode,
    };

    lookup.set(`${homeCode}:${awayCode}:${dateKey}`, resolved);
    lookup.set(`${awayCode}:${homeCode}:${dateKey}`, resolved);
  }

  return lookup;
}

export async function loadFifaCalendarLookup(): Promise<Map<string, FifaResolvedMatch>> {
  const data = (await fifaFetch(
    `/calendar/matches?idSeason=${fifaSeason()}&count=500&language=en`,
  )) as { Results?: CalendarMatch[] };

  return buildFifaCalendarLookup(data.Results ?? []);
}

export function resolveFifaMatchFromCalendar(
  lookup: Map<string, FifaResolvedMatch>,
  homeTeam: string,
  awayTeam: string,
  kickoffAt: string,
): FifaResolvedMatch | null {
  const homeCode = fifaCodeFromOpenFootball(homeTeam);
  const awayCode = fifaCodeFromOpenFootball(awayTeam);
  const dateKey = kickoffDateKey(kickoffAt);
  if (!homeCode || !awayCode || !dateKey) return null;

  return lookup.get(`${homeCode}:${awayCode}:${dateKey}`) ?? null;
}

function normalizePlayerName(raw: string): string {
  return titleCasePlayerName(raw);
}

function teamNameFromFifaCode(
  code: string | null | undefined,
  fallbackHome: string,
  fallbackAway: string,
  homeCode: string,
  awayCode: string,
): string | null {
  if (!code) return null;
  const open = openFootballNameFromFifaCode(code);
  if (open) return open;
  const upper = code.toUpperCase();
  if (upper === homeCode) return fallbackHome;
  if (upper === awayCode) return fallbackAway;
  return null;
}

function playerNameFromLiveTeams(
  idPlayer: string,
  payload: {
    HomeTeam?: { Players?: FifaPlayer[]; Abbreviation?: string };
    AwayTeam?: { Players?: FifaPlayer[]; Abbreviation?: string };
  },
): { playerName: string; teamCode: string } | null {
  for (const side of ["HomeTeam", "AwayTeam"] as const) {
    const team = payload[side];
    const abbr = team?.Abbreviation?.trim().toUpperCase() ?? "";
    for (const player of team?.Players ?? []) {
      if (player.IdPlayer !== idPlayer) continue;
      const name = loc(player.PlayerName) ?? loc(player.ShortName);
      if (!name) return null;
      return { playerName: normalizePlayerName(name), teamCode: abbr };
    }
  }
  return null;
}

type ExplicitMvpField = {
  playerId?: string;
  playerName?: string;
  teamCode?: string;
};

function readExplicitMvpField(node: unknown): ExplicitMvpField | null {
  if (!node || typeof node !== "object") return null;

  const obj = node as Record<string, unknown>;
  const playerId =
    (typeof obj.IdPlayer === "string" && obj.IdPlayer) ||
    (typeof obj.IdPlayerOfTheMatch === "string" && obj.IdPlayerOfTheMatch) ||
    (typeof obj.PlayerId === "string" && obj.PlayerId) ||
    undefined;

  const playerName =
    (typeof obj.PlayerName === "string" && obj.PlayerName) ||
    (typeof obj.Name === "string" && obj.Name) ||
    (Array.isArray(obj.PlayerName) && loc(obj.PlayerName as Localized)) ||
    (Array.isArray(obj.Name) && loc(obj.Name as Localized)) ||
    undefined;

  const teamCode =
    (typeof obj.IdCountry === "string" && obj.IdCountry) ||
    (typeof obj.Abbreviation === "string" && obj.Abbreviation) ||
    (typeof obj.TeamAbbreviation === "string" && obj.TeamAbbreviation) ||
    undefined;

  if (!playerId && !playerName) return null;
  return { playerId, playerName: playerName ? normalizePlayerName(playerName) : undefined, teamCode };
}

function findExplicitMvpField(root: unknown, depth = 0): ExplicitMvpField | null {
  if (depth > 6 || root == null) return null;
  if (Array.isArray(root)) {
    for (const item of root) {
      const hit = findExplicitMvpField(item, depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  if (typeof root !== "object") return null;

  for (const [key, value] of Object.entries(root as Record<string, unknown>)) {
    if (EXPLICIT_MVP_KEY.test(key.replace(/[^a-z]/gi, ""))) {
      const parsed = readExplicitMvpField(value);
      if (parsed) return parsed;
    }
  }

  for (const value of Object.values(root as Record<string, unknown>)) {
    const hit = findExplicitMvpField(value, depth + 1);
    if (hit) return hit;
  }

  return null;
}

export function findFifaTimelineMvpPlayerId(
  payload: { Event?: Array<Record<string, unknown>> },
): string | null {
  for (const event of payload.Event ?? []) {
    const type = loc(event.TypeLocalized as Localized) ?? "";
    const desc = loc(event.EventDescription as Localized) ?? "";
    if (!EXPLICIT_MVP_LABEL.test(`${type} ${desc}`)) continue;
    if (typeof event.IdPlayer === "string" && event.IdPlayer.trim()) {
      return event.IdPlayer.trim();
    }
  }
  return null;
}

export function parseOfficialMvpFromFifaLive(
  payload: Record<string, unknown>,
  homeTeam: string,
  awayTeam: string,
  resolved: FifaResolvedMatch,
): OfficialMvpFromFifa | null {
  const field = findExplicitMvpField(payload);
  if (!field) return null;

  let playerName = field.playerName ?? "";
  let teamCode = field.teamCode?.toUpperCase() ?? "";

  if (field.playerId) {
    const fromLineup = playerNameFromLiveTeams(field.playerId, payload as {
      HomeTeam?: { Players?: FifaPlayer[]; Abbreviation?: string };
      AwayTeam?: { Players?: FifaPlayer[]; Abbreviation?: string };
    });
    if (fromLineup) {
      playerName = fromLineup.playerName;
      teamCode = fromLineup.teamCode || teamCode;
    }
  }

  if (!playerName.trim()) return null;

  const teamName =
    teamNameFromFifaCode(teamCode, homeTeam, awayTeam, resolved.homeCode, resolved.awayCode) ??
    homeTeam;

  return {
    playerName,
    teamName,
    sourceCode: FIFA_WC_SOURCE_CODE,
    sourceExternalKey: resolved.idMatch,
    signal: "live_field",
  };
}

export async function fetchOfficialMvpFromFifa(
  resolved: FifaResolvedMatch,
  homeTeam: string,
  awayTeam: string,
): Promise<OfficialMvpFromFifa | null> {
  const livePath = `/live/football/${resolved.idCompetition}/${resolved.idSeason}/${resolved.idStage}/${resolved.idMatch}?language=en`;

  const [timeline, live] = await Promise.all([
    fifaFetch(`/timelines/${resolved.idMatch}`) as Promise<{ Event?: Array<Record<string, unknown>> }>,
    fifaFetch(livePath) as Promise<Record<string, unknown>>,
  ]);

  const timelinePlayerId = findFifaTimelineMvpPlayerId(timeline);
  if (timelinePlayerId) {
    const fromLineup = playerNameFromLiveTeams(timelinePlayerId, live);
    if (fromLineup) {
      const teamName =
        teamNameFromFifaCode(
          fromLineup.teamCode,
          homeTeam,
          awayTeam,
          resolved.homeCode,
          resolved.awayCode,
        ) ?? homeTeam;
      return {
        playerName: fromLineup.playerName,
        teamName,
        sourceCode: FIFA_WC_SOURCE_CODE,
        sourceExternalKey: resolved.idMatch,
        signal: "timeline",
      };
    }
  }

  return parseOfficialMvpFromFifaLive(live, homeTeam, awayTeam, resolved);
}
