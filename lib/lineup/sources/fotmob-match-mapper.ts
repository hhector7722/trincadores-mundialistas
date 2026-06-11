import { teamNamesMatch } from "@/lib/lineup/sources/api-football-names";
import type { FotMobMatchListItem } from "@/lib/live/sources/fotmob-official-mvp";
import {
  kickoffDeltaMinutes,
  type InternalMatchRef,
} from "@/lib/lineup/sources/api-football-match-mapper";

export type FotMobFixtureRef = {
  fixtureId: number;
  kickoffIso: string;
  homeName: string;
  awayName: string;
};

const KICKOFF_TOLERANCE_MINUTES = 180;

export function fotMobListItemToFixture(item: FotMobMatchListItem): FotMobFixtureRef | null {
  const id = item.id;
  const kickoffIso = item.status?.utcTime?.trim();
  if (!id || !kickoffIso) return null;

  const homeName = item.home?.longName?.trim() || item.home?.name?.trim() || "";
  const awayName = item.away?.longName?.trim() || item.away?.name?.trim() || "";
  if (!homeName || !awayName) return null;

  return {
    fixtureId: id,
    kickoffIso,
    homeName,
    awayName,
  };
}

function teamsMatchFixture(match: InternalMatchRef, fixture: FotMobFixtureRef): boolean {
  const direct =
    teamNamesMatch(fixture.homeName, match.home_team) &&
    teamNamesMatch(fixture.awayName, match.away_team);
  if (direct) return true;

  return (
    teamNamesMatch(fixture.homeName, match.away_team) &&
    teamNamesMatch(fixture.awayName, match.home_team)
  );
}

export type FotMobFixtureMapResult = {
  match: InternalMatchRef;
  fixture: FotMobFixtureRef;
  kickoffDeltaMinutes: number;
};

export function mapFotmobFixturesToInternalMatches(
  matches: InternalMatchRef[],
  fixtures: FotMobFixtureRef[]
): { mapped: FotMobFixtureMapResult[]; unmapped: InternalMatchRef[] } {
  const mapped: FotMobFixtureMapResult[] = [];
  const usedFixtureIds = new Set<number>();

  for (const match of matches) {
    let best: FotMobFixtureMapResult | null = null;

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
