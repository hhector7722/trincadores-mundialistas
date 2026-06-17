import assert from "node:assert/strict";
import test from "node:test";
import { resolveQuizEntryAction } from "./entry-action";
import type { QuizDayHub, QuizDaySlot } from "./types";

function slot(
  scoringMode: "training" | "competitive",
  status: "submitted" | "in_progress" | null,
): QuizDaySlot {
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
      opens_at: "2020-01-01T00:00:00.000Z",
      closes_at: "2030-01-01T00:00:00.000Z",
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

function hub(overrides: Partial<QuizDayHub> = {}): QuizDayHub {
  return {
    quizDate: "2026-06-06",
    competitive: true,
    publishHeld: false,
    drillAvailable: false,
    official: slot("competitive", null),
    bonus: null,
    ...overrides,
  };
}

test("resolveQuizEntryAction pausa editorial muestra proximamente", () => {
  assert.deepEqual(resolveQuizEntryAction(hub({ publishHeld: true, official: null })), {
    type: "coming_soon",
  });
});

test("resolveQuizEntryAction sin quiz publicado va al hub", () => {
  assert.deepEqual(resolveQuizEntryAction(hub({ official: null })), {
    type: "navigate",
    href: "/quiz",
  });
});

test("resolveQuizEntryAction competitivo completado muestra ya jugado", () => {
  assert.deepEqual(
    resolveQuizEntryAction(hub({ official: slot("competitive", "submitted") })),
    { type: "already_played" },
  );
});

test("resolveQuizEntryAction en curso pide confirmacion para continuar", () => {
  assert.deepEqual(
    resolveQuizEntryAction(hub({ official: slot("competitive", "in_progress") })),
    { type: "confirm_start", href: "/quiz/play?resume=1&start=1" },
  );
});

test("resolveQuizEntryAction listo pide confirmacion", () => {
  assert.deepEqual(resolveQuizEntryAction(hub()), {
    type: "confirm_start",
    href: "/quiz/play?start=1",
  });
});
