import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTeamLookup, mapGamesToOpenFootball } from "./match-mapper";
import type { OpenFootballMatchRef, OpenFootballTeamRef, Wc2026GameRow, Wc2026TeamRow } from "@/lib/worldcup-data/types";

const ofTeams: OpenFootballTeamRef[] = [
  { id: "uuid-mex", external_key: "mexico", name: "Mexico", fifa_name: "MEX" },
  { id: "uuid-rsa", external_key: "south-africa", name: "South Africa", fifa_name: "RSA" },
];

const wc26Teams: Wc2026TeamRow[] = [
  { sourceId: "1", nameEn: "Mexico", fifaCode: "MEX", iso2: "MX", groupCode: "A" },
  { sourceId: "2", nameEn: "South Africa", fifaCode: "RSA", iso2: "ZA", groupCode: "A" },
];

const ofMatches: OpenFootballMatchRef[] = [
  {
    id: "match-1",
    external_match_id: "WC2026-G-A-1",
    home_team: "Mexico",
    away_team: "South Africa",
    kickoff_at: "2026-06-11T13:00:00-06:00",
    group_code: "A",
    match_number: 1,
  },
];

const game: Wc2026GameRow = {
  sourceId: "1",
  homeTeamSourceId: "1",
  awayTeamSourceId: "2",
  homeScore: 0,
  awayScore: 0,
  groupCode: "A",
  matchday: 1,
  kickoffIso: "2026-06-11T09:30:00.000Z",
  stadiumSourceId: "1",
  finished: false,
  timeElapsed: "notstarted",
  type: "group",
};

test("buildTeamLookup enlaza fifa_code con OpenFootball", () => {
  const lookup = buildTeamLookup(wc26Teams, ofTeams);
  assert.equal(lookup.get("1")?.name, "Mexico");
  assert.equal(lookup.get("2")?.name, "South Africa");
});

test("mapGamesToOpenFootball mapea por equipos y fecha", () => {
  const lookup = buildTeamLookup(wc26Teams, ofTeams);
  const results = mapGamesToOpenFootball([game], wc26Teams, ofMatches, lookup);
  assert.equal(results.length, 1);
  assert.equal(results[0].status, "mapped");
  assert.equal(results[0].matchId, "match-1");
});

test("mapGamesToOpenFootball deja pending si no hay candidato", () => {
  const lookup = buildTeamLookup(wc26Teams, ofTeams);
  const orphan: Wc2026GameRow = { ...game, homeTeamSourceId: "99", awayTeamSourceId: "2" };
  const results = mapGamesToOpenFootball([orphan], wc26Teams, ofMatches, lookup);
  assert.equal(results[0].status, "pending");
});
