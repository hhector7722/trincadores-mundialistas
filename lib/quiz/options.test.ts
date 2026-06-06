import assert from "node:assert/strict";
import test from "node:test";
import { parseQuizOptions, validateQuizAnswers } from "./options";

test("parseQuizOptions accepts 4 options", () => {
  const parsed = parseQuizOptions([
    { id: "a", label: "Uruguay" },
    { id: "b", label: "Brasil" },
    { id: "c", label: "Alemania" },
    { id: "d", label: "Italia" },
  ]);
  assert.equal(parsed.length, 4);
  assert.equal(parsed[0]?.id, "a");
});

test("validateQuizAnswers requires all question ids", () => {
  const ok = validateQuizAnswers(["q1", "q2"], { q1: "a", q2: "b" });
  assert.equal(ok.ok, true);

  const fail = validateQuizAnswers(["q1", "q2"], { q1: "a" });
  assert.equal(fail.ok, false);
});
