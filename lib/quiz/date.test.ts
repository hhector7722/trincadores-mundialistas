import assert from "node:assert/strict";
import test from "node:test";
import { todayQuizDate } from "./date";

test("todayQuizDate returns YYYY-MM-DD format", () => {
  const value = todayQuizDate(new Date("2026-06-15T10:00:00Z"));
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/);
});
