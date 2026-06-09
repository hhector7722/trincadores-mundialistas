import { teamNamesMatch } from "@/lib/lineup/sources/api-football-names";

export type InternalMatchRef = {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  external_match_id: string | null;
};

export type ApiFootballFixtureRef = {
  fixtureId: number;
  kickoffIso: string;
  homeName: string;
  awayName: string;
  homeTeamId: number | null;
  awayTeamId: number | null;
};

export type FixtureMapResult = {
  match: InternalMatchRef;
  fixture: ApiFootballFixtureRef;
  kickoffDeltaMinutes: number;
};

const KICKOFF_TOLERANCE_MINUTES = 180;

export function kickoffToMs(iso: string): number | null {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

export function kickoffDeltaMinutes(internalIso: string, apiIso: string): number | null {
  const internalMs = kickoffToMs(internalIso);
  const apiMs = kickoffToMs(apiIso);
  if (internalMs == null || apiMs == null) return null;
  return Math.round(Math.abs(internalMs - apiMs) / 60_000);
}

function teamsMatchFixture(match: InternalMatchRef, fixture: ApiFootballFixtureRef): boolean {
  const direct =
    teamNamesMatch(fixture.homeName, match.home_team) &&
    teamNamesMatch(fixture.awayName, match.away_team);
  if (direct) return true;

  // Algunos feeds intercambian local/visitante respecto a OpenFootball.
  return (
    teamNamesMatch(fixture.homeName, match.away_team) &&
    teamNamesMatch(fixture.awayName, match.home_team)
  );
}

export function mapFixturesToInternalMatches(
  matches: InternalMatchRef[],
  fixtures: ApiFootballFixtureRef[]
): { mapped: FixtureMapResult[]; unmapped: InternalMatchRef[] } {
  const mapped: FixtureMapResult[] = [];
  const usedFixtureIds = new Set<number>();

  for (const match of matches) {
    let best: FixtureMapResult | null = null;

    for (const fixture of fixtures) {
      if (usedFixtureIds.has(fixture.fixtureId)) continue;
      if (!teamsMatchFixture(match, fixture)) continue;

      const delta = kickoffDeltaMinutes(match.kickoff_at, fixture.kickoffIso);
      if (delta == null || delta > KICKOFF_TOLERANCE_MINUTES) continue;

      if (!best || delta < best.kickoffDeltaMinutes) {
        best = { match, fixture, kickoffDeltaMinutes: delta };
      }
    }

    if (best) {
      mapped.push(best);
      usedFixtureIds.add(best.fixture.fixtureId);
    }
  }

  const mappedIds = new Set(mapped.map((row) => row.match.id));
  const unmapped = matches.filter((match) => !mappedIds.has(match.id));

  return { mapped, unmapped };
}
