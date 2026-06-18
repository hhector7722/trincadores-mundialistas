import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canAccessAiPrediction } from "@/lib/ai-predictions/access";
import { formatPredictionInsightUpdatedAgo } from "@/lib/ai-predictions/format-updated-ago";

describe("canAccessAiPrediction", () => {
  it("solo hector tiene acceso", () => {
    assert.equal(canAccessAiPrediction("hector"), true);
    assert.equal(canAccessAiPrediction("Héctor"), true);
    assert.equal(canAccessAiPrediction("HECTOR"), true);
  });

  it("rechaza otros alias y roles", () => {
    assert.equal(canAccessAiPrediction("admin"), false);
    assert.equal(canAccessAiPrediction("paco"), false);
    assert.equal(canAccessAiPrediction(null), false);
    assert.equal(canAccessAiPrediction(undefined), false);
  });

  it("no usa displayName", () => {
    assert.equal(canAccessAiPrediction("Hector"), true);
    assert.equal(canAccessAiPrediction("Héctor"), true);
  });
});

describe("formatPredictionInsightUpdatedAgo", () => {
  it("formatea minutos", () => {
    const iso = new Date(Date.now() - 23 * 60_000).toISOString();
    assert.match(formatPredictionInsightUpdatedAgo(iso), /23 min/);
  });
});
