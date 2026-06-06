import {
  WC2026_GROUP_CODES,
  WC2026_GROUP_SEEDS,
} from "@/lib/openfootball/wc2026-groups";

export const CALENDAR_GROUPS_PANEL_DAYS = [8, 9] as const;

/** Celda columna X en la fila del panel GRUPOS: sin número de día, fondo dock. */
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

type GroupMatchLike = {
  group_code: string | null;
  home_team: string;
  away_team: string;
  officialHome: number | null;
  officialAway: number | null;
};

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
  matches: T[]
): Map<string, Map<string, TeamStats>> {
  const statsByGroup = new Map<string, Map<string, TeamStats>>();

  for (const code of WC2026_GROUP_CODES) {
    statsByGroup.set(code, new Map());
  }

  for (const match of matches) {
    const code = match.group_code?.toUpperCase();
    if (!code || match.officialHome == null || match.officialAway == null) continue;

    const groupStats = statsByGroup.get(code);
    if (!groupStats) continue;

    applyResult(groupStats, match.home_team, match.away_team, match.officialHome, match.officialAway);
  }

  return statsByGroup;
}

/** Clasificación detallada por grupo a partir de resultados oficiales. */
export function buildGroupStandingsDetail<T extends GroupMatchLike>(
  matches: T[]
): GroupStandingDetail[] {
  const statsByGroup = buildGroupStatsMaps(matches);

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
  matches: T[]
): GroupStandingRow[] {
  return buildGroupStandingsDetail(matches).map((group) => ({
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

export function isCalendarGroupsCompanionDay(dayNumber: number | null): boolean {
  return dayNumber === CALENDAR_GROUPS_COMPANION_DAY;
}
