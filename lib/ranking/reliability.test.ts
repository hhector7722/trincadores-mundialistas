import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BAYESIAN_WEIGHT_M,
  DEFAULT_COMMUNITY_AVG,
  computeReliabilityPct,
} from "@/lib/ranking/reliability";

const C = DEFAULT_COMMUNITY_AVG;

describe("computeReliabilityPct (bayesian, C=0.35, m=7)", () => {
  it("N=0 devuelve null", () => {
    assert.equal(computeReliabilityPct(0, 0, C), null);
  });

  it("N=1, puntos=5 → Fiab ≈ 43%", () => {
    assert.equal(computeReliabilityPct(1, 5, C), 43);
  });

  it("N=1, puntos=2 → Fiab ≈ 36%", () => {
    assert.equal(computeReliabilityPct(1, 2, C), 36);
  });

  it("N=10, puntos=28 → Fiab ≈ 47%", () => {
    assert.equal(computeReliabilityPct(10, 28, C), 47);
  });

  it("N=60, puntos=210 → Fiab ≈ 66%", () => {
    assert.equal(computeReliabilityPct(60, 210, C), 66);
  });

  it("usa BAYESIAN_WEIGHT_M=7", () => {
    assert.equal(BAYESIAN_WEIGHT_M, 7);
  });
});
