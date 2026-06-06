import assert from "node:assert/strict";
import test from "node:test";
import {
  FEEDBACK_DELAY_MS,
  QUESTION_TIME_SEC,
  nextStepAfterFeedback,
  pickWrongOptionId,
  resolveOptionVisualState,
  shouldAutoSubmit,
} from "./play-flow";

const options = [
  { id: "a", label: "A" },
  { id: "b", label: "B" },
  { id: "c", label: "C" },
  { id: "d", label: "D" },
];

test("pickWrongOptionId returns first non-correct option", () => {
  assert.equal(pickWrongOptionId(options, "b"), "a");
});

test("resolveOptionVisualState during answering is default", () => {
  assert.equal(
    resolveOptionVisualState({
      optionId: "b",
      selectedOptionId: "b",
      correctOptionId: "b",
      phase: "answering",
    }),
    "default"
  );
});

test("resolveOptionVisualState shows correct and wrong on feedback", () => {
  assert.equal(
    resolveOptionVisualState({
      optionId: "b",
      selectedOptionId: "b",
      correctOptionId: "b",
      phase: "feedback",
    }),
    "correct"
  );
  assert.equal(
    resolveOptionVisualState({
      optionId: "a",
      selectedOptionId: "a",
      correctOptionId: "b",
      phase: "feedback",
    }),
    "wrong"
  );
  assert.equal(
    resolveOptionVisualState({
      optionId: "b",
      selectedOptionId: "a",
      correctOptionId: "b",
      phase: "feedback",
    }),
    "revealed"
  );
});

test("shouldAutoSubmit only on last question", () => {
  assert.equal(shouldAutoSubmit(0, 3), false);
  assert.equal(shouldAutoSubmit(2, 3), true);
});

test("nextStepAfterFeedback advances or stops at end", () => {
  assert.equal(nextStepAfterFeedback(0, 3), 1);
  assert.equal(nextStepAfterFeedback(2, 3), null);
});

test("constants are within expected ranges", () => {
  assert.equal(QUESTION_TIME_SEC, 10);
  assert.ok(FEEDBACK_DELAY_MS >= 800 && FEEDBACK_DELAY_MS <= 1200);
});
