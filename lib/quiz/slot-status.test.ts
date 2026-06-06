import assert from "node:assert/strict";
import test from "node:test";
import { canOpenQuizPlay, canReplayQuiz } from "./slot-status";
import type { QuizDaySlot } from "./types";

function slot(scoringMode: "training" | "competitive", status: "submitted" | "in_progress"): QuizDaySlot {
  return {
    quiz: {
      id: "q1",
      pool_id: "p1",
      title: "Quiz",
      quiz_date: "2026-06-06",
      kind: "official",
      scoring_mode: scoringMode,
      max_points: scoringMode === "competitive" ? 3 : 0,
      settings_json: {},
      opens_at: null,
      closes_at: null,
    },
    attempt: {
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

test("owner can replay competitive after submitted", () => {
  const s = slot("competitive", "submitted");
  const access = { isOwner: true };
  assert.equal(canOpenQuizPlay(s, undefined, access), true);
  assert.equal(canReplayQuiz(s, access), true);
});
