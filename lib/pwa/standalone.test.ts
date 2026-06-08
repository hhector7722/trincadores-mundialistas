import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isStandalonePWA } from "./standalone";

describe("isStandalonePWA", () => {
  it("devuelve false sin window", () => {
    assert.equal(isStandalonePWA(), false);
  });
});
