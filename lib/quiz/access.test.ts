import assert from "node:assert/strict";
import test from "node:test";
import { canAccessQuizBeta } from "./access";

test("canAccessQuizBeta solo permite hector", () => {
  assert.equal(canAccessQuizBeta("Hector"), true);
  assert.equal(canAccessQuizBeta("hector"), true);
  assert.equal(canAccessQuizBeta("Héctor"), true);
  assert.equal(canAccessQuizBeta("maria"), false);
  assert.equal(canAccessQuizBeta(null), false);
});
