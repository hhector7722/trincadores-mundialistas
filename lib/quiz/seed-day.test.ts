import assert from "node:assert/strict";
import test from "node:test";
import { parseSeedQuizDayFile, scoringFieldsForMode } from "./seed-day";

test("parseSeedQuizDayFile accepts official 3 questions", () => {
  const parsed = parseSeedQuizDayFile({
    quiz_date: "2026-06-06",
    official: {
      questions: [
        {
          sort_order: 1,
          prompt: "P1",
          options: [
            { id: "a", label: "A" },
            { id: "b", label: "B" },
            { id: "c", label: "C" },
            { id: "d", label: "D" },
          ],
          correct_option_id: "a",
        },
        {
          sort_order: 2,
          prompt: "P2",
          options: [
            { id: "a", label: "A" },
            { id: "b", label: "B" },
            { id: "c", label: "C" },
            { id: "d", label: "D" },
          ],
          correct_option_id: "b",
        },
        {
          sort_order: 3,
          prompt: "P3",
          options: [
            { id: "a", label: "A" },
            { id: "b", label: "B" },
            { id: "c", label: "C" },
            { id: "d", label: "D" },
          ],
          correct_option_id: "c",
        },
      ],
    },
  });

  assert.equal(parsed.quiz_date, "2026-06-06");
  assert.equal(parsed.official.questions.length, 3);
});

test("scoringFieldsForMode returns zero for training and bonus", () => {
  assert.deepEqual(scoringFieldsForMode("official", "training"), {
    max_points: 0,
    question_points: 0,
  });
  assert.deepEqual(scoringFieldsForMode("bonus", "competitive"), {
    max_points: 0,
    question_points: 0,
  });
  assert.deepEqual(scoringFieldsForMode("official", "competitive"), {
    max_points: 3,
    question_points: 1,
  });
});
