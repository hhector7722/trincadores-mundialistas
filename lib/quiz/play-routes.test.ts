import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isQuizPlayResume, isQuizPlayStartAuthorized } from "./play-routes";

describe("isQuizPlayResume", () => {
  it("solo resume con resume=1", () => {
    assert.equal(isQuizPlayResume({}), false);
    assert.equal(isQuizPlayResume({ resume: "0" }), false);
    assert.equal(isQuizPlayResume({ resume: "1" }), true);
  });
});

describe("isQuizPlayStartAuthorized", () => {
  it("solo autoriza con start=1", () => {
    assert.equal(isQuizPlayStartAuthorized({}), false);
    assert.equal(isQuizPlayStartAuthorized({ start: "0" }), false);
    assert.equal(isQuizPlayStartAuthorized({ start: "1" }), true);
  });
});
