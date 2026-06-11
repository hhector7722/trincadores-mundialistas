import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildQuizDailyReminderCopy } from "./quiz-daily-reminder";

describe("quiz daily reminder", () => {
  it("buildQuizDailyReminderCopy devuelve título y plazo de cierre", () => {
    const copy = buildQuizDailyReminderCopy();
    assert.equal(copy.title, "Quiz diario pendiente");
    assert.equal(copy.body, "Tienes hasta las 23:59 para completarlo.");
  });
});
