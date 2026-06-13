import assert from "node:assert/strict";
import test from "node:test";
import {
  isQuizPublishHeld,
  QUIZ_PUBLISH_HOLD_DATES,
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
