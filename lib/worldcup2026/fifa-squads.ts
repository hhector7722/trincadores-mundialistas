/**
 * Cliente FIFA first-party para convocatorias WC 2026.
 * Fuente: api.fifa.com (listas oficiales publicadas jun 2026).
 */

const DEFAULT_BASE = "https://api.fifa.com/api/v3";
const DEFAULT_SEASON = "285023";
const DEFAULT_COMPETITION = "17";

type Localized = Array<{ Locale?: string; Description?: string }>;

export type FifaCalendarTeamRef = {
  idTeam: string;
  fifaCode: string;
  nameEn: string;
};

export type FifaSquadPlayerRaw = {
  idPlayer: string;
  name: string;
  shirtNumber: number | null;
  position: string | null;
};

type RawCalendarMatch = {
  Home?: { IdTeam?: string; Abbreviation?: string; TeamName?: Localized };
  Away?: { IdTeam?: string; Abbreviation?: string; TeamName?: Localized };
};

type RawCalendarResponse = { Results?: RawCalendarMatch[] };

type RawSquadPlayer = {
  IdPlayer?: string;
  PlayerName?: Localized;
  JerseyNum?: number | null;
  PositionLocalized?: Localized;
};

type RawSquadResponse = {
  IdTeam?: string;
  TeamName?: Localized;
  Players?: RawSquadPlayer[];
};

function loc(items?: Localized | null): string | null {
  if (!items?.length) return null;
  const en = items.find((e) => e.Locale === "en-GB") ?? items[0];
  return en.Description?.trim() ?? null;
}

/** Capitaliza tokens de nombre (Unicode-safe; JS \\b rompe con acentos). */
function capitalizePlayerToken(token: string): string {
  const lower = token.toLowerCase();
  if (!lower) return lower;
  if (lower.startsWith("mc") && lower.length > 2) {
    return `Mc${lower.slice(2, 3).toUpperCase()}${lower.slice(3)}`;
  }
  if (lower.startsWith("mac") && lower.length > 3) {
    return `Mac${lower.slice(3, 4).toUpperCase()}${lower.slice(4)}`;
  }
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** "Raul RANGEL" → "Raul Rangel"; "VINÍCIUS JR." → "Vinícius Jr." */
export function titleCasePlayerName(name: string): string {
  return name
    .trim()
    .split(/(\s+|\.)/)
    .map((part) => {
      if (/^\s*$/.test(part) || part === ".") return part;
      return capitalizePlayerToken(part);
    })
    .join("");
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
  });
  if (!res.ok) {
    throw new Error(`FIFA API ${path}: HTTP ${res.status}`);
  }
  return res.json();
}

/** Extrae equipos únicos del calendario FIFA (Abbreviation → IdTeam). */
export async function fetchFifaCalendarTeams(): Promise<FifaCalendarTeamRef[]> {
  const data = (await fifaFetch(
    `/calendar/matches?idSeason=${fifaSeason()}&count=500&language=en`
  )) as RawCalendarResponse;

  const byCode = new Map<string, FifaCalendarTeamRef>();
  for (const m of data.Results ?? []) {
    for (const side of [m.Home, m.Away]) {
      const code = side?.Abbreviation?.trim();
      const idTeam = side?.IdTeam?.trim();
      if (!code || !idTeam) continue;
      if (byCode.has(code)) continue;
      byCode.set(code, {
        idTeam,
        fifaCode: code,
        nameEn: loc(side?.TeamName) ?? code,
      });
    }
  }
  return [...byCode.values()].sort((a, b) => a.fifaCode.localeCompare(b.fifaCode));
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Convocatoria oficial de un equipo (26 jugadores). Reintenta 403/429/5xx. */
export async function fetchFifaTeamSquad(idTeam: string): Promise<FifaSquadPlayerRaw[]> {
  const path = `/teams/${idTeam}/squad?idCompetition=${DEFAULT_COMPETITION}&idSeason=${fifaSeason()}&language=en`;
  let lastErr: unknown;

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const raw = (await fifaFetch(path)) as RawSquadResponse;
      return (raw.Players ?? [])
        .filter((p) => p.IdPlayer)
        .map((p) => ({
          idPlayer: p.IdPlayer as string,
          name: titleCasePlayerName(loc(p.PlayerName) ?? "Unknown"),
          shirtNumber: typeof p.JerseyNum === "number" ? p.JerseyNum : null,
          position: loc(p.PositionLocalized),
        }));
    } catch (err) {
      lastErr = err;
      await delay(600 * 2 ** attempt);
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(`FIFA squad retries exhausted: ${idTeam}`);
}
