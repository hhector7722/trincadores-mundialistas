import assert from "node:assert/strict";
import test from "node:test";
import {
  isQuizPublishHeld,
  QUIZ_PUBLISH_HOLD_DATES,
  resolveQuizPublishWindow,
  todayQuizDate,
} from "./date";

test("todayQuizDate returns YYYY-MM-DD format", () => {
  const value = todayQuizDate(new Date("2026-06-15T10:00:00Z"));
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/);
});

test("isQuizPublishHeld blocks configured Madrid dates", () => {
  for (const heldDate of QUIZ_PUBLISH_HOLD_DATES) {
    assert.equal(isQuizPublishHeld(heldDate), true);
  }
  assert.equal(isQuizPublishHeld("2026-06-13"), false);
});

test("resolveQuizPublishWindow mantiene el dia en el cron de medianoche", () => {
  const atCron = new Date("2026-06-14T22:00:30.000Z");
  const result = resolveQuizPublishWindow("2026-06-15", atCron);
  assert.equal(result.quizDate, "2026-06-15");
});

test("resolveQuizPublishWindow aplaza publicacion manual diurna al dia siguiente", () => {
  const afternoon = new Date("2026-06-15T14:00:00.000Z");
  const result = resolveQuizPublishWindow("2026-06-15", afternoon);
  assert.equal(result.quizDate, "2026-06-16");
  assert.ok(new Date(result.opensAt).getTime() > afternoon.getTime());
});
