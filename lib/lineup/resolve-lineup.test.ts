import assert from "node:assert/strict";
import test from "node:test";
import { isBetterLineupSource } from "./lineup-queries";

test("isBetterLineupSource respeta prioridad confirmed > predicted > fallback", () => {
  assert.equal(isBetterLineupSource("confirmed", "predicted"), true);
  assert.equal(isBetterLineupSource("predicted", "fallback"), true);
  assert.equal(isBetterLineupSource("fallback", "confirmed"), false);
  assert.equal(isBetterLineupSource("confirmed", null), true);
});
