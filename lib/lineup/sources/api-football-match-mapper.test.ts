import assert from "node:assert/strict";
import test from "node:test";
import {
  mapFixturesToInternalMatches,
  type ApiFootballFixtureRef,
  type InternalMatchRef,
} from "./api-football-match-mapper";

const internal: InternalMatchRef[] = [
  {
    id: "m1",
    home_team: "Mexico",
    away_team: "South Africa",
    kickoff_at: "2026-06-11T19:00:00+00:00",
    external_match_id: "WC2026-G-A-1",
  },
  {
    id: "m2",
    home_team: "USA",
    away_team: "Paraguay",
    kickoff_at: "2026-06-13T01:00:00+00:00",
    external_match_id: "WC2026-G-D-1",
  },
];

const fixtures: ApiFootballFixtureRef[] = [
  {
    fixtureId: 1001,
    kickoffIso: "2026-06-11T19:00:00+00:00",
    homeName: "Mexico",
    awayName: "South Africa",
    homeTeamId: 1,
    awayTeamId: 2,
  },
  {
    fixtureId: 1002,
    kickoffIso: "2026-06-13T01:00:00+00:00",
    homeName: "United States",
    awayName: "Paraguay",
    homeTeamId: 3,
    awayTeamId: 4,
  },
];

test("mapFixturesToInternalMatches empareja por equipos y hora", () => {
  const { mapped, unmapped } = mapFixturesToInternalMatches(internal, fixtures);
  assert.equal(mapped.length, 2);
  assert.equal(unmapped.length, 0);
  assert.equal(mapped[0]?.fixture.fixtureId, 1001);
  assert.equal(mapped[1]?.fixture.fixtureId, 1002);
});

test("mapFixturesToInternalMatches deja pendientes sin coincidencia", () => {
  const { mapped, unmapped } = mapFixturesToInternalMatches(internal, fixtures.slice(0, 1));
  assert.equal(mapped.length, 1);
  assert.equal(unmapped.length, 1);
  assert.equal(unmapped[0]?.id, "m2");
});
