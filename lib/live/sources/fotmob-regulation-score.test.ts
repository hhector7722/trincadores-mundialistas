import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseFotmobScoringOutcome } from "./fotmob-regulation-score";

describe("parseFotmobScoringOutcome", () => {
  it("Noruega 1-1 / Inglaterra gana 1-2 tras prórroga: 90 min = 1-1, clasifica visitante", () => {
    const outcome = parseFotmobScoringOutcome({
      status: {
        scoreStr: "1 - 2",
        reason: { short: "AET", shortKey: "afterextratime_short" },
      },
      events: {
        homeTeamGoals: {
          Schjelderup: [{ homeScore: 0, awayScore: 0, newScore: [1, 0], shotmapEvent: { period: "FirstHalf" } }],
        },
        awayTeamGoals: {
          Bellingham: [
            { homeScore: 1, awayScore: 0, newScore: [1, 1], shotmapEvent: { period: "SecondHalf" } },
            { homeScore: 1, awayScore: 1, newScore: [1, 2], shotmapEvent: { period: "FirstHalfExtra" } },
          ],
        },
      },
    });

    assert.ok(outcome);
    assert.equal(outcome.regulationHome, 1);
    assert.equal(outcome.regulationAway, 1);
    assert.equal(outcome.finalHome, 1);
    assert.equal(outcome.finalAway, 2);
    assert.equal(outcome.advancingTeam, "away");
  });

  it("partido normal sin prórroga mantiene marcador final", () => {
    const outcome = parseFotmobScoringOutcome({
      status: { scoreStr: "2 - 1", reason: { short: "FT" } },
    });

    assert.ok(outcome);
    assert.equal(outcome.regulationHome, 2);
    assert.equal(outcome.regulationAway, 1);
    assert.equal(outcome.advancingTeam, "home");
  });
});
