import {
  WC2026_GROUP_CODES,
  WC2026_GROUP_SEEDS,
} from "@/lib/openfootball/wc2026-groups";

export const CALENDAR_GROUPS_PANEL_DAYS = [8, 9] as const;

/** Columnas L, M y X de la primera fila del calendario (días 8–10). */
export const CALENDAR_SIDEBAR_DAYS = [8, 9, 10] as const;

/** @deprecated Usar CALENDAR_SIDEBAR_DAYS */
export const CALENDAR_GROUPS_COMPANION_DAY = 10 as const;

export type GroupTeamStanding = {
  team: string;
  pts: number;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
};

export type GroupStandingRow = {
  code: string;
  teams: string[];
};

export type GroupStandingDetail = {
  code: string;
  teams: GroupTeamStanding[];
};

export type GroupStandingsSource = "official" | "predictions";

/** Partido normalizado para el motor de clasificación (Real + Mi porra). Sin tabla auxiliar en BD. */
export type GroupMatchLike = {
  group_code: string | null;
  home_team: string;
  away_team: string;
  officialHome: number | null;
  officialAway: number | null;
  predictedHome?: number | null;
  predictedAway?: number | null;
};

function resolveMatchScore(
  match: GroupMatchLike,
  source: GroupStandingsSource
): { home: number; away: number } | null {
  if (source === "official") {
    if (match.officialHome == null || match.officialAway == null) return null;
    return { home: match.officialHome, away: match.officialAway };
  }

  const home = match.predictedHome;
  const away = match.predictedAway;
  if (!Number.isInteger(home) || !Number.isInteger(away)) return null;
  return { home: home as number, away: away as number };
}

type TeamStats = {
  played: number;
  won: number;
  drawn: number;
  points: number;
  gf: number;
  ga: number;
};

function emptyStats(): TeamStats {
  return { played: 0, won: 0, drawn: 0, points: 0, gf: 0, ga: 0 };
}

function applyResult(
  stats: Map<string, TeamStats>,
  home: string,
  away: string,
  homeGoals: number,
  awayGoals: number
) {
  const homeStats = stats.get(home) ?? emptyStats();
  const awayStats = stats.get(away) ?? emptyStats();

  homeStats.played += 1;
  awayStats.played += 1;
  homeStats.gf += homeGoals;
  homeStats.ga += awayGoals;
  awayStats.gf += awayGoals;
  awayStats.ga += homeGoals;

  if (homeGoals > awayGoals) {
    homeStats.won += 1;
    homeStats.points += 3;
  } else if (homeGoals < awayGoals) {
    awayStats.won += 1;
    awayStats.points += 3;
  } else {
    homeStats.drawn += 1;
    awayStats.drawn += 1;
    homeStats.points += 1;
    awayStats.points += 1;
  }

  stats.set(home, homeStats);
  stats.set(away, awayStats);
}

function sortTeamsInGroup(
  teams: string[],
  stats: Map<string, TeamStats>,
  seedOrder: readonly string[]
): string[] {
  const seedIndex = (team: string) => {
    const idx = seedOrder.indexOf(team);
    return idx >= 0 ? idx : seedOrder.length + teams.indexOf(team);
  };

  return [...teams].sort((a, b) => {
    const sa = stats.get(a) ?? emptyStats();
    const sb = stats.get(b) ?? emptyStats();

    if (sb.points !== sa.points) return sb.points - sa.points;

    const gdA = sa.gf - sa.ga;
    const gdB = sb.gf - sb.ga;
    if (gdB !== gdA) return gdB - gdA;

    if (sb.gf !== sa.gf) return sb.gf - sa.gf;

    return seedIndex(a) - seedIndex(b);
  });
}

function toTeamStanding(team: string, stats: TeamStats): GroupTeamStanding {
  const pp = stats.played - stats.won - stats.drawn;
  return {
    team,
    pts: stats.points,
    pj: stats.played,
    pg: stats.won,
    pe: stats.drawn,
    pp,
    gf: stats.gf,
    gc: stats.ga,
    dg: stats.gf - stats.ga,
  };
}

function collectGroupTeams<T extends GroupMatchLike>(
  matches: T[],
  code: string,
  seedOrder: readonly string[]
): string[] {
  const teamsInMatches = new Set<string>();

  for (const match of matches) {
    if (match.group_code?.toUpperCase() !== code) continue;
    teamsInMatches.add(match.home_team);
    teamsInMatches.add(match.away_team);
  }

  if (teamsInMatches.size === 0) return [...seedOrder];

  return [
    ...seedOrder.filter((t) => teamsInMatches.has(t)),
    ...[...teamsInMatches].filter((t) => !seedOrder.includes(t)),
  ];
}

function buildGroupStatsMaps<T extends GroupMatchLike>(
  matches: T[],
  source: GroupStandingsSource = "official"
): Map<string, Map<string, TeamStats>> {
  const statsByGroup = new Map<string, Map<string, TeamStats>>();

  for (const code of WC2026_GROUP_CODES) {
    statsByGroup.set(code, new Map());
  }

  for (const match of matches) {
    const code = match.group_code?.toUpperCase();
    const score = resolveMatchScore(match, source);
    if (!code || !score) continue;

    const groupStats = statsByGroup.get(code);
    if (!groupStats) continue;

    applyResult(groupStats, match.home_team, match.away_team, score.home, score.away);
  }

  return statsByGroup;
}

/** Adapta partidos del calendario/pronósticos al formato del motor de agregación. */
export function toGroupMatchRows(
  matches: Array<{
    group_code: string | null;
    home_team: string;
    away_team: string;
    officialHome: number | null;
    officialAway: number | null;
    prediction?: { home_goals: number; away_goals: number } | null;
  }>
): GroupMatchLike[] {
  return matches.map((match) => ({
    group_code: match.group_code,
    home_team: match.home_team,
    away_team: match.away_team,
    officialHome: match.officialHome,
    officialAway: match.officialAway,
    predictedHome: match.prediction?.home_goals ?? null,
    predictedAway: match.prediction?.away_goals ?? null,
  }));
}

/**
 * Clasificación detallada por grupo.
 * - `official`: marcador de `match_results` (partidos sin resultado oficial se omiten).
 * - `predictions`: marcador del usuario en `predictions` (partidos sin pronóstico se omiten).
 */
export function buildGroupStandingsDetail<T extends GroupMatchLike>(
  matches: T[],
  source: GroupStandingsSource = "official"
): GroupStandingDetail[] {
  const statsByGroup = buildGroupStatsMaps(matches, source);

  return WC2026_GROUP_CODES.map((code) => {
    const seedOrder = WC2026_GROUP_SEEDS[code] ?? [];
    const teamNames = collectGroupTeams(matches, code, seedOrder);
    const stats = statsByGroup.get(code) ?? new Map();
    const sortedTeams = sortTeamsInGroup(teamNames, stats, seedOrder);

    return {
      code,
      teams: sortedTeams.map((team) => toTeamStanding(team, stats.get(team) ?? emptyStats())),
    };
  });
}

/** Clasificación por grupo (solo orden de banderas en calendario). */
export function buildGroupStandings<T extends GroupMatchLike>(
  matches: T[],
  source: GroupStandingsSource = "official"
): GroupStandingRow[] {
  return buildGroupStandingsDetail(matches, source).map((group) => ({
    code: group.code,
    teams: group.teams.map((row) => row.team),
  }));
}

export function findGroupStandingDetail(
  groups: GroupStandingDetail[],
  code: string
): GroupStandingDetail | null {
  return groups.find((group) => group.code === code.toUpperCase()) ?? null;
}

export function isCalendarGroupsPanelDay(dayNumber: number | null): boolean {
  return (
    dayNumber != null &&
    (CALENDAR_GROUPS_PANEL_DAYS as readonly number[]).includes(dayNumber)
  );
}

export function isCalendarSidebarDay(dayNumber: number | null): boolean {
  return (
    dayNumber != null &&
    (CALENDAR_SIDEBAR_DAYS as readonly number[]).includes(dayNumber)
  );
}

export function isCalendarGroupsCompanionDay(dayNumber: number | null): boolean {
  return dayNumber === CALENDAR_GROUPS_COMPANION_DAY;
}
