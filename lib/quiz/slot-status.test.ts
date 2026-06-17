import assert from "node:assert/strict";
import test from "node:test";
import {
  canOpenQuizDrill,
  canOpenQuizPlay,
  canReplayQuiz,
  getQuizPlayCta,
  shouldShowQuizAlreadyPlayedModal,
} from "./slot-status";
import type { QuizDaySlot } from "./types";

import { todayQuizDate } from "./date";

function slot(
  scoringMode: "training" | "competitive",
  status: "submitted" | "in_progress" | null
): QuizDaySlot {
  return {
    quiz: {
      id: "q1",
      pool_id: "p1",
      title: "Quiz",
      quiz_date: todayQuizDate(),
      kind: "official",
      scoring_mode: scoringMode,
      max_points: scoringMode === "competitive" ? 3 : 0,
      settings_json: {},
      opens_at: null,
      closes_at: null,
    },
    attempt:
      status === null
        ? null
        : {
            id: "a1",
            quiz_id: "q1",
            profile_id: "u1",
            status,
            score: 0,
            started_at: new Date().toISOString(),
            submitted_at: status === "submitted" ? new Date().toISOString() : null,
            expires_at: null,
          },
  };
}

test("training allows replay after submitted", () => {
  const s = slot("training", "submitted");
  assert.equal(canOpenQuizPlay(s), true);
  assert.equal(canReplayQuiz(s), true);
});

test("competitive blocks replay after submitted", () => {
  const s = slot("competitive", "submitted");
  assert.equal(canOpenQuizPlay(s), false);
  assert.equal(canReplayQuiz(s), false);
});

test("competitive completed blocks replay and shows result cta", () => {
  const s = slot("competitive", "submitted");
  const blocked = getQuizPlayCta(s, { resultAttemptId: "a1" });
  assert.equal(blocked?.entersPlay, false);
  assert.equal(blocked?.href, "/quiz/result?attempt=a1");
  assert.equal(shouldShowQuizAlreadyPlayedModal(s), true);
  assert.equal(canOpenQuizPlay(s), false);
  assert.equal(canReplayQuiz(s), false);
});

test("training completed still allows replay consistently", () => {
  const s = slot("training", "submitted");
  const cta = getQuizPlayCta(s);
  assert.equal(cta?.entersPlay, true);
  assert.equal(shouldShowQuizAlreadyPlayedModal(s), false);
});

test("competitive completado permite entrenar si hay intento oficial", () => {
  const s = slot("competitive", "submitted");
  const drillSlot: QuizDaySlot = { ...s, countingSubmittedAttemptId: "a1" };
  assert.equal(canOpenQuizDrill(drillSlot), true);
});

test("competitive sin completar no permite entrenar", () => {
  assert.equal(canOpenQuizDrill(slot("competitive", null)), false);
});
