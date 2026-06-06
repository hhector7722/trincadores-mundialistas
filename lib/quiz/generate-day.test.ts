import assert from "node:assert/strict";
import test from "node:test";
import { loadFacts } from "./facts";
import { generateQuizDay, selectFactsForDay } from "./generate-day";
import { assertGeneratedQuestions } from "./quality";

test("selectFactsForDay picks 3 facts deterministically", () => {
  const facts = loadFacts();
  const a = selectFactsForDay({ quizDate: "2026-06-07", facts });
  const b = selectFactsForDay({ quizDate: "2026-06-07", facts });
  assert.deepEqual(
    a.map((f) => f.id),
    b.map((f) => f.id)
  );
  assert.equal(a.length, 3);
});

test("generateQuizDay produces 3 valid questions", () => {
  const facts = loadFacts();
  const day = generateQuizDay({ quizDate: "2026-06-08", facts });
  assert.equal(day.quiz_date, "2026-06-08");
  assert.equal(day.official.questions.length, 3);
  assertGeneratedQuestions(day.official.questions);
  assert.equal(day._meta?.fact_ids.length, 3);
});
