import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  NOTIFICATION_KIND_CONFIRMED_LINEUP,
  NOTIFICATION_KIND_MATCH_HIGHLIGHT,
  NOTIFICATION_KIND_PREDICTION_REMINDER,
  NOTIFICATION_KIND_QUIZ_ACTIVE,
  NOTIFICATION_KIND_QUIZ_DAILY_REMINDER,
} from "@/lib/notifications/kinds";
import {
  confirmedLineupNotificationUrl,
  matchHighlightNotificationUrl,
  predictionReminderNotificationUrl,
  pushUrlForNotificationKind,
  quizActiveNotificationUrl,
  quizDailyReminderNotificationUrl,
} from "./urls";

describe("push urls", () => {
  const origin = "https://trincadores.example";

  it("quizActiveNotificationUrl abre modal desde home", () => {
    assert.equal(quizActiveNotificationUrl(origin), `${origin}/?quiz-active=1`);
  });

  it("quizDailyReminderNotificationUrl lleva al hub del quiz", () => {
    assert.equal(quizDailyReminderNotificationUrl(origin), `${origin}/quiz`);
  });

  it("predictionReminderNotificationUrl lleva al partido", () => {
    const matchId = "abc-123";
    assert.equal(
      predictionReminderNotificationUrl(matchId, origin),
      `${origin}/predictions/${matchId}`,
    );
  });

  it("confirmedLineupNotificationUrl abre alineaciones del partido", () => {
    const matchId = "abc-123";
    assert.equal(
      confirmedLineupNotificationUrl(matchId, origin),
      `${origin}/predictions?lineups=${matchId}`,
    );
  });

  it("matchHighlightNotificationUrl abre el reproductor del resumen", () => {
    const matchId = "abc-123";
    assert.equal(
      matchHighlightNotificationUrl(matchId, origin),
      `${origin}/predictions?highlight=${matchId}`,
    );
  });

  it("pushUrlForNotificationKind cubre los cinco tipos configurados", () => {
    const matchId = "abc-123";
    assert.equal(pushUrlForNotificationKind(NOTIFICATION_KIND_QUIZ_ACTIVE), "/?quiz-active=1");
    assert.equal(pushUrlForNotificationKind(NOTIFICATION_KIND_QUIZ_DAILY_REMINDER), "/quiz");
    assert.equal(
      pushUrlForNotificationKind(NOTIFICATION_KIND_CONFIRMED_LINEUP, matchId),
      `/predictions?lineups=${matchId}`,
    );
    assert.equal(
      pushUrlForNotificationKind(NOTIFICATION_KIND_PREDICTION_REMINDER, matchId),
      `/predictions/${matchId}`,
    );
    assert.equal(
      pushUrlForNotificationKind(NOTIFICATION_KIND_MATCH_HIGHLIGHT, matchId),
      `/predictions?highlight=${matchId}`,
    );
    assert.equal(pushUrlForNotificationKind("unknown"), null);
  });
});
