import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildQuizDailyReminderCopy } from "./quiz-daily-reminder";

describe("quiz daily reminder", () => {
  it("buildQuizDailyReminderCopy menciona el plazo de cierre", () => {
    const copy = buildQuizDailyReminderCopy("Mundial 1986");
    assert.equal(copy.title, "Quiz del día pendiente");
    assert.match(copy.body, /Mundial 1986/);
    assert.match(copy.body, /23:59/);
  });

  it("buildQuizDailyReminderCopy sin título usa texto genérico", () => {
    const copy = buildQuizDailyReminderCopy();
    assert.match(copy.body, /el quiz de hoy/);
  });
});
