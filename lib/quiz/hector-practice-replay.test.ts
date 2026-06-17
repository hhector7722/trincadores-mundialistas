import assert from "node:assert/strict";
import test from "node:test";
import {
  canHectorPracticeReplay,
  HECTOR_PRACTICE_REPLAY_DATE,
  isHectorAlias,
} from "./hector-practice-replay";
import type { QuizAttemptRow } from "./types";

function attempt(
  overrides: Partial<QuizAttemptRow> & Pick<QuizAttemptRow, "status">
): QuizAttemptRow {
  return {
    id: "a1",
    quiz_id: "q1",
    profile_id: "u1",
    score: 2,
    started_at: new Date().toISOString(),
    submitted_at: new Date().toISOString(),
    expires_at: null,
    counts_for_score: true,
    ...overrides,
  };
}

test("isHectorAlias normaliza alias", () => {
  assert.equal(isHectorAlias("Hector"), true);
  assert.equal(isHectorAlias("other"), false);
});

test("canHectorPracticeReplay solo hector en fecha acotada", () => {
  const attempts = [attempt({ status: "submitted", counts_for_score: true })];
  assert.equal(
    canHectorPracticeReplay("hector", HECTOR_PRACTICE_REPLAY_DATE, attempts, "q1"),
    true
  );
  assert.equal(
    canHectorPracticeReplay("hector", "2026-06-18", attempts, "q1"),
    false
  );
  assert.equal(
    canHectorPracticeReplay("aitor", HECTOR_PRACTICE_REPLAY_DATE, attempts, "q1"),
    false
  );
});

test("canHectorPracticeReplay bloquea si ya hay intento de practica", () => {
  const attempts = [
    attempt({ id: "a1", status: "submitted", counts_for_score: true }),
    attempt({ id: "a2", status: "submitted", counts_for_score: false }),
  ];
  assert.equal(
    canHectorPracticeReplay("hector", HECTOR_PRACTICE_REPLAY_DATE, attempts, "q1"),
    false
  );
});
