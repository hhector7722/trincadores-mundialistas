import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveKnockoutTeams,
  resolveKnockoutWinnerTeam,
  type KnockoutResultSnapshot,
} from "./resolve-knockout-teams";
import type { MatchWithPrediction } from "@/lib/predictions/queries";

function koMatch(
  partial: Partial<MatchWithPrediction> & Pick<MatchWithPrediction, "match_number" | "home_team" | "away_team">
): MatchWithPrediction {
  return {
    id: `m-${partial.match_number}`,
    kickoff_at: "2026-07-11T21:00:00Z",
    status: "finished",
    matchday_name: "KO",
    matchday_external_key: "WC2026:quarter-final",
    external_match_id: null,
    group_code: null,
    officialHome: null,
    officialAway: null,
    officialMvpPlayerName: null,
    officialMvpTeamName: null,
    officialPenaltyHome: null,
    officialPenaltyAway: null,
    officialAdvancingTeam: null,
    highlightYoutubeId: null,
    highlightPublishedAt: null,
    highlightSource: null,
    prediction: null,
    mvpPrediction: null,
    playerIncidents: [],
    serverEditable: false,
    editUntilKickoff: false,
    ...partial,
  };
}

describe("resolveKnockoutWinnerTeam", () => {
  it("empate 90 min + advancing_team away → gana visitante", () => {
    const snapshot: KnockoutResultSnapshot = {
      homeTeam: "Norway",
      awayTeam: "England",
      status: "finished",
      officialHome: 1,
      officialAway: 1,
      officialAdvancingTeam: "away",
    };
    assert.equal(resolveKnockoutWinnerTeam(snapshot, true), "England");
    assert.equal(resolveKnockoutWinnerTeam(snapshot, false), "Norway");
  });
});

describe("resolveKnockoutTeams", () => {
  it("semifinal 15 jul resuelve England vs Argentina tras cuartos con prórroga", () => {
    const matches = resolveKnockoutTeams([
      koMatch({
        match_number: 99,
        home_team: "Norway",
        away_team: "England",
        officialHome: 1,
        officialAway: 1,
        officialAdvancingTeam: "away",
      }),
      koMatch({
        match_number: 100,
        home_team: "Argentina",
        away_team: "Switzerland",
        kickoff_at: "2026-07-12T01:00:00Z",
        officialHome: 1,
        officialAway: 1,
        officialAdvancingTeam: "home",
      }),
      koMatch({
        match_number: 102,
        home_team: "W99",
        away_team: "W100",
        kickoff_at: "2026-07-15T21:00:00Z",
        status: "scheduled",
      }),
    ]);

    const semi = matches.find((m) => m.match_number === 102);
    assert.equal(semi?.home_team, "England");
    assert.equal(semi?.away_team, "Argentina");
  });
});
