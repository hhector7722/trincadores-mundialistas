import {
  WC2026_GROUP_CODES,
  WC2026_GROUP_SEEDS,
} from "@/lib/openfootball/wc2026-groups";

export const CALENDAR_GROUPS_PANEL_DAYS = [8, 9] as const;

/** Celda columna X en la fila del panel GRUPOS: sin número de día, fondo dock. */
export const CALENDAR_GROUPS_COMPANION_DAY = 10 as const;

export type GroupStandingRow = {
  code: string;
  teams: string[];
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
  points: number;
  gf: number;
  ga: number;
};

function emptyStats(): TeamStats {
  return { played: 0, points: 0, gf: 0, ga: 0 };
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
    homeStats.points += 3;
  } else if (homeGoals < awayGoals) {
    awayStats.points += 3;
  } else {
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

/** Clasificación por grupo a partir de resultados oficiales; empate inicial = orden del sorteo. */
export function buildGroupStandings<T extends GroupMatchLike>(
  matches: T[]
): GroupStandingRow[] {
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

  return WC2026_GROUP_CODES.map((code) => {
    const seedOrder = WC2026_GROUP_SEEDS[code] ?? [];
    const teamsInMatches = new Set<string>();

    for (const match of matches) {
      if (match.group_code?.toUpperCase() !== code) continue;
      teamsInMatches.add(match.home_team);
      teamsInMatches.add(match.away_team);
    }

    const teams =
      teamsInMatches.size > 0
        ? [...seedOrder.filter((t) => teamsInMatches.has(t)), ...[...teamsInMatches].filter((t) => !seedOrder.includes(t))]
        : [...seedOrder];

    const stats = statsByGroup.get(code) ?? new Map();
    return {
      code,
      teams: sortTeamsInGroup(teams, stats, seedOrder),
    };
  });
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
