import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isQuizPlayResume } from "./play-routes";

describe("isQuizPlayResume", () => {
  it("solo resume con resume=1", () => {
    assert.equal(isQuizPlayResume({}), false);
    assert.equal(isQuizPlayResume({ resume: "0" }), false);
    assert.equal(isQuizPlayResume({ resume: "1" }), true);
  });
});
