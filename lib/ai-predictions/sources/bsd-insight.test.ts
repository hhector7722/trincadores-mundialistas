import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapBsdPredictionToInsight } from "@/lib/ai-predictions/sources/bsd-insight";

describe("mapBsdPredictionToInsight", () => {
  it("mapea predicción BSD real a insight UI", () => {
    const insight = mapBsdPredictionToInsight(
      {
        created_at: "2026-06-02T10:52:59Z",
        markets: {
          match_result: {
            prob_home: 55.5,
            prob_draw: 22.9,
            prob_away: 21.6,
            predicted: "H",
          },
          expected_goals: { home: 0.73, away: 1.2 },
          btts: { prob_yes: 28.7 },
          score: { most_likely: "0-1" },
        },
        model: { confidence: 0.5553, version: "v5.0" },
      },
      "Mexico",
      "South Korea",
      "Son Heung-min",
    );

    assert.match(insight.mainPrediction, /México 0-1 Corea del Sur/);
    assert.equal(insight.confidence, "Alta");
    assert.equal(insight.mvpPlayerName, "Son Heung-min");
    assert.equal(insight.homeWinProb, 56);
    assert.equal(insight.alternatives.length, 2);
    assert.match(insight.analysis, /CatBoost BSD v5/);
  });
});
