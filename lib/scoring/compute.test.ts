import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeMatchPoints, matchOutcome } from "./compute";
import { MATCH_SCORE_POINTS } from "@/lib/predictions/scoring";

describe("matchOutcome", () => {
  it("detecta victoria local, empate y visitante", () => {
    assert.equal(matchOutcome(2, 1), 1);
    assert.equal(matchOutcome(1, 1), 0);
    assert.equal(matchOutcome(0, 2), -1);
  });
});

describe("computeMatchPoints", () => {
  it("5 puntos por marcador exacto", () => {
    assert.equal(
      computeMatchPoints({ predictedHome: 2, predictedAway: 1, resultHome: 2, resultAway: 1 }),
      MATCH_SCORE_POINTS.exact
    );
  });

  it("2 puntos solo por signo", () => {
    assert.equal(
      computeMatchPoints({ predictedHome: 2, predictedAway: 0, resultHome: 1, resultAway: 0 }),
      MATCH_SCORE_POINTS.sign
    );
  });

  it("0 puntos si falla signo", () => {
    assert.equal(
      computeMatchPoints({ predictedHome: 2, predictedAway: 0, resultHome: 0, resultAway: 1 }),
      MATCH_SCORE_POINTS.miss
    );
  });

  it("diferencia correcta sin exacto cuenta como signo (2 pts)", () => {
    assert.equal(
      computeMatchPoints({ predictedHome: 3, predictedAway: 1, resultHome: 2, resultAway: 0 }),
      MATCH_SCORE_POINTS.sign
    );
  });

  it("exacto no suma signo aparte (exclusivo)", () => {
    const pts = computeMatchPoints({
      predictedHome: 1,
      predictedAway: 1,
      resultHome: 1,
      resultAway: 1,
    });
    assert.equal(pts, MATCH_SCORE_POINTS.exact);
  });
});

describe("computeMatchPoints eliminatorias", () => {
  const knockout = { isKnockout: true as const };

  it("1-1 + clasificado correcto = 5 pts", () => {
    assert.equal(
      computeMatchPoints({
        ...knockout,
        predictedHome: 1,
        predictedAway: 1,
        predictedAdvancing: "away",
        resultHome: 1,
        resultAway: 1,
        resultAdvancing: "away",
      }),
      5,
    );
  });

  it("1-1 + clasificado incorrecto = 3 pts", () => {
    assert.equal(
      computeMatchPoints({
        ...knockout,
        predictedHome: 1,
        predictedAway: 1,
        predictedAdvancing: "home",
        resultHome: 1,
        resultAway: 1,
        resultAdvancing: "away",
      }),
      3,
    );
  });

  it("1-2 cuando el 90 min fue 1-1 = 2 pts (solo clasificado)", () => {
    assert.equal(
      computeMatchPoints({
        ...knockout,
        predictedHome: 1,
        predictedAway: 2,
        resultHome: 1,
        resultAway: 1,
        resultAdvancing: "away",
      }),
      2,
    );
  });
});
