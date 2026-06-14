import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DAILY_LAB_QUESTION_FORMATS,
  labDailyPackSettingsSummary,
  type QuizLabDailyPack,
} from "@/lib/quiz/lab/daily-pack.server";
import { seedFromQuizDate } from "@/lib/quiz/rng";

test("DAILY_LAB_QUESTION_FORMATS incluye los 4 formatos de imagen", () => {
  assert.equal(DAILY_LAB_QUESTION_FORMATS.length, 4);
  assert.ok(DAILY_LAB_QUESTION_FORMATS.includes("guess_player_silhouette"));
  assert.ok(DAILY_LAB_QUESTION_FORMATS.includes("image_trivia"));
});

test("labDailyPackSettingsSummary resume el pack para settings_json", () => {
  const pack: QuizLabDailyPack = {
    quizDate: "2026-06-14",
    generatedAt: "2026-06-14T00:00:00.000Z",
    momentIds: ["wc2022-messi-cup"],
    questions: [],
  };

  const summary = labDailyPackSettingsSummary(pack);
  assert.equal(summary.quiz_date, "2026-06-14");
  assert.equal(summary.question_count, 0);
  assert.deepEqual(summary.moment_ids, ["wc2022-messi-cup"]);
});

test("seedFromQuizDate es estable para la misma fecha", () => {
  assert.equal(seedFromQuizDate("2026-06-14"), seedFromQuizDate("2026-06-14"));
  assert.notEqual(seedFromQuizDate("2026-06-14"), seedFromQuizDate("2026-06-15"));
});
