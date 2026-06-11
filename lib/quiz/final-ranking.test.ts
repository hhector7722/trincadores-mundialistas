import assert from "node:assert/strict";
import test from "node:test";
import { computeQuizFinalRankingBonuses } from "@/lib/quiz/final-ranking";

test("computeQuizFinalRankingBonuses asigna 5-3-2-1 al top 4", () => {
  const bonuses = computeQuizFinalRankingBonuses([
    { profileId: "a", totalScore: 30 },
    { profileId: "b", totalScore: 25 },
    { profileId: "c", totalScore: 20 },
    { profileId: "d", totalScore: 15 },
    { profileId: "e", totalScore: 10 },
  ]);

  assert.equal(bonuses.get("a")?.bonusPoints, 5);
  assert.equal(bonuses.get("b")?.bonusPoints, 3);
  assert.equal(bonuses.get("c")?.bonusPoints, 2);
  assert.equal(bonuses.get("d")?.bonusPoints, 1);
  assert.equal(bonuses.has("e"), false);
});

test("computeQuizFinalRankingBonuses reparte la misma posición en empates", () => {
  const bonuses = computeQuizFinalRankingBonuses([
    { profileId: "a", totalScore: 20 },
    { profileId: "b", totalScore: 20 },
    { profileId: "c", totalScore: 15 },
  ]);

  assert.equal(bonuses.get("a")?.position, 1);
  assert.equal(bonuses.get("b")?.position, 1);
  assert.equal(bonuses.get("a")?.bonusPoints, 5);
  assert.equal(bonuses.get("b")?.bonusPoints, 5);
  assert.equal(bonuses.get("c")?.position, 3);
  assert.equal(bonuses.get("c")?.bonusPoints, 2);
});
