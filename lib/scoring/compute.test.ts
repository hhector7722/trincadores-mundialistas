import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeMatchPoints, matchOutcome } from "./compute";

describe("matchOutcome", () => {
  it("detecta victoria local, empate y visitante", () => {
    assert.equal(matchOutcome(2, 1), 1);
    assert.equal(matchOutcome(1, 1), 0);
    assert.equal(matchOutcome(0, 2), -1);
  });
});

describe("computeMatchPoints", () => {
  it("8 puntos por marcador exacto", () => {
    assert.equal(
      computeMatchPoints({ predictedHome: 2, predictedAway: 1, resultHome: 2, resultAway: 1 }),
      8
    );
  });

  it("5 puntos por diferencia correcta sin marcador exacto", () => {
    assert.equal(
      computeMatchPoints({ predictedHome: 3, predictedAway: 1, resultHome: 2, resultAway: 0 }),
      5
    );
  });

  it("3 puntos solo por signo", () => {
    assert.equal(
      computeMatchPoints({ predictedHome: 2, predictedAway: 0, resultHome: 1, resultAway: 0 }),
      3
    );
  });

  it("0 puntos si falla signo", () => {
    assert.equal(
      computeMatchPoints({ predictedHome: 2, predictedAway: 0, resultHome: 0, resultAway: 1 }),
      0
    );
  });

  it("exacto no suma 5 ni 3 (exclusivo)", () => {
    const pts = computeMatchPoints({
      predictedHome: 1,
      predictedAway: 1,
      resultHome: 1,
      resultAway: 1,
    });
    assert.equal(pts, 8);
  });
});