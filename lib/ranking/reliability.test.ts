import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MATCH_SCORE_POINTS, MVP_PREDICTION_POINTS } from "@/lib/predictions/scoring";
import {
  BAYESIAN_WEIGHT_M,
  DEFAULT_COMMUNITY_AVG,
  computeMatchReliabilityUnit,
  computeReliabilityPct,
} from "@/lib/ranking/reliability";

const C = DEFAULT_COMMUNITY_AVG;

describe("computeMatchReliabilityUnit (70/30/5)", () => {
  it("fallo total → 0", () => {
    assert.equal(computeMatchReliabilityUnit(MATCH_SCORE_POINTS.miss, null), 0);
  });

  it("solo signo → 70%", () => {
    assert.equal(
      computeMatchReliabilityUnit(MATCH_SCORE_POINTS.sign, null),
      0.7
    );
  });

  it("exacto → 100%", () => {
    assert.equal(
      computeMatchReliabilityUnit(MATCH_SCORE_POINTS.exact, null),
      1
    );
  });

  it("signo + MVP → 75%", () => {
    assert.equal(
      computeMatchReliabilityUnit(
        MATCH_SCORE_POINTS.sign,
        MVP_PREDICTION_POINTS
      ),
      0.75
    );
  });

  it("exacto + MVP → 100% (cap)", () => {
    assert.equal(
      computeMatchReliabilityUnit(
        MATCH_SCORE_POINTS.exact,
        MVP_PREDICTION_POINTS
      ),
      1
    );
  });

  it("fallo + MVP acertado → 5%", () => {
    assert.equal(
      computeMatchReliabilityUnit(MATCH_SCORE_POINTS.miss, MVP_PREDICTION_POINTS),
      0.05
    );
  });
});

describe("computeReliabilityPct (bayesian, C=0.48, m=7)", () => {
  it("N=0 devuelve null", () => {
    assert.equal(computeReliabilityPct(0, 0, C), null);
  });

  it("N=1, solo signo → Fiab ≈ 51%", () => {
    assert.equal(computeReliabilityPct(1, 0.7, C), 51);
  });

  it("N=1, exacto → Fiab ≈ 54%", () => {
    assert.equal(computeReliabilityPct(1, 1, C), 54);
  });

  it("N=10, todos signo → Fiab ≈ 61%", () => {
    assert.equal(computeReliabilityPct(10, 7, C), 61);
  });

  it("N=60, todos signo → Fiab ≈ 68%", () => {
    assert.equal(computeReliabilityPct(60, 42, C), 68);
  });

  it("usa BAYESIAN_WEIGHT_M=7", () => {
    assert.equal(BAYESIAN_WEIGHT_M, 7);
  });
});
