import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isQuizCronWindow, madridHour, quizDateForCron } from "./cron";

describe("quiz cron", () => {
  it("madridHour devuelve hora 0-23", () => {
    const hour = madridHour(new Date("2026-06-09T03:00:00.000Z"));
    assert.ok(hour >= 0 && hour <= 23);
  });

  it("isQuizCronWindow es true a las 5:00 Madrid (CEST)", () => {
    // 03:00 UTC = 05:00 CEST en junio
    const atFive = new Date("2026-06-09T03:15:00.000Z");
    assert.equal(isQuizCronWindow(atFive), true);
  });

  it("isQuizCronWindow es false fuera de las 5:00 Madrid", () => {
    const atNoon = new Date("2026-06-09T10:00:00.000Z");
    assert.equal(isQuizCronWindow(atNoon), false);
  });

  it("quizDateForCron usa fecha civil Madrid", () => {
    assert.equal(quizDateForCron(new Date("2026-06-09T03:00:00.000Z")), "2026-06-09");
  });
});
