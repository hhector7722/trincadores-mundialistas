import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isMvpPredictionCorrect, resolveScoreOutcome } from "./prediction-outcome";

describe("resolveScoreOutcome", () => {
  it("exacto", () => {
    assert.equal(
      resolveScoreOutcome({ predictedHome: 2, predictedAway: 1, resultHome: 2, resultAway: 1 }),
      "exact",
    );
  });

  it("solo signo", () => {
    assert.equal(
      resolveScoreOutcome({ predictedHome: 2, predictedAway: 0, resultHome: 3, resultAway: 1 }),
      "sign",
    );
  });

  it("fallo", () => {
    assert.equal(
      resolveScoreOutcome({ predictedHome: 1, predictedAway: 0, resultHome: 0, resultAway: 1 }),
      "miss",
    );
  });
});

describe("isMvpPredictionCorrect", () => {
  it("acierta jugador y equipo", () => {
    assert.equal(
      isMvpPredictionCorrect("Lamine Yamal", "Spain", "Lamine Yamal", "Spain"),
      true,
    );
  });

  it("falla sin MVP oficial", () => {
    assert.equal(isMvpPredictionCorrect("Lamine Yamal", "Spain", null, "Spain"), false);
  });
});
