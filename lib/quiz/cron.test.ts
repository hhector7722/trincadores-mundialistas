import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isQuizCloseWindow,
  isQuizOpenWindow,
  madridHour,
  quizCronAction,
  quizDateForCron,
} from "./cron";
import { isQuizWindowOpen, quizDayClosesAt, quizDayOpensAt } from "./date";

describe("quiz cron", () => {
  it("madridHour devuelve hora 0-23", () => {
    const hour = madridHour(new Date("2026-06-09T03:00:00.000Z"));
    assert.ok(hour >= 0 && hour <= 23);
  });

  it("isQuizOpenWindow es true a las 00:00 Madrid (CEST)", () => {
    const atMidnight = new Date("2026-06-08T22:00:00.000Z");
    assert.equal(isQuizOpenWindow(atMidnight), true);
    assert.equal(quizCronAction(atMidnight), "open");
  });

  it("isQuizCloseWindow es true a las 23:59 Madrid (CEST)", () => {
    const atClose = new Date("2026-06-09T21:59:00.000Z");
    assert.equal(isQuizCloseWindow(atClose), true);
    assert.equal(quizCronAction(atClose), "close");
  });

  it("fuera de medianoche y cierre no dispara accion", () => {
    const atNoon = new Date("2026-06-09T10:00:00.000Z");
    assert.equal(isQuizOpenWindow(atNoon), false);
    assert.equal(isQuizCloseWindow(atNoon), false);
    assert.equal(quizCronAction(atNoon), null);
  });

  it("quizDateForCron usa fecha civil Madrid", () => {
    assert.equal(quizDateForCron(new Date("2026-06-09T03:00:00.000Z")), "2026-06-09");
  });
});

describe("quiz day window", () => {
  it("abre y cierra en el mismo dia civil Madrid", () => {
    const quizDate = "2026-06-09";
    const opensAt = new Date(quizDayOpensAt(quizDate));
    const closesAt = new Date(quizDayClosesAt(quizDate));

    assert.ok(closesAt.getTime() > opensAt.getTime());
    assert.equal(
      opensAt.toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" }),
      quizDate
    );
    assert.equal(
      closesAt.toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" }),
      quizDate
    );
  });

  it("isQuizWindowOpen respeta opens_at y closes_at", () => {
    const quizDate = "2026-06-09";
    const opensAt = quizDayOpensAt(quizDate);
    const closesAt = quizDayClosesAt(quizDate);
    const quiz = { quiz_date: quizDate, opens_at: opensAt, closes_at: closesAt };

    assert.equal(isQuizWindowOpen(quiz, new Date(opensAt)), true);
    assert.equal(
      isQuizWindowOpen(quiz, new Date(new Date(opensAt).getTime() - 1000)),
      false
    );
    assert.equal(
      isQuizWindowOpen(quiz, new Date(new Date(closesAt).getTime() + 1000)),
      false
    );
  });
});
