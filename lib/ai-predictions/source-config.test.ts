import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  predictionInsightSourceLabel,
  resolvePredictionInsightSource,
} from "@/lib/ai-predictions/source-config";

describe("resolvePredictionInsightSource", () => {
  it("default hibrido", () => {
    const prev = process.env.PREDICTION_INSIGHT_SOURCE;
    delete process.env.PREDICTION_INSIGHT_SOURCE;
    assert.equal(resolvePredictionInsightSource(), "hybrid");
    process.env.PREDICTION_INSIGHT_SOURCE = prev;
  });

  it("acepta override", () => {
    assert.equal(resolvePredictionInsightSource("bsd"), "bsd");
    assert.equal(resolvePredictionInsightSource("hybrid"), "hybrid");
  });
});

describe("predictionInsightSourceLabel", () => {
  it("etiqueta hibrido", () => {
    assert.equal(predictionInsightSourceLabel("hybrid"), "BSD + Gemini");
  });
});
