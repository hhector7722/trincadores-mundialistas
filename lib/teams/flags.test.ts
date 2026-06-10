import test from "node:test";
import assert from "node:assert/strict";
import { nearestFlagcdnWidth, teamFlagCode, teamFlagUrl } from "./flags";

test("nearestFlagcdnWidth ajusta anchos no soportados por flagcdn", () => {
  assert.equal(nearestFlagcdnWidth(240), 160);
  assert.equal(nearestFlagcdnWidth(120), 80);
  assert.equal(nearestFlagcdnWidth(28), 20);
  assert.equal(nearestFlagcdnWidth(80), 80);
});

test("teamFlagUrl usa anchos válidos de flagcdn", () => {
  assert.equal(teamFlagUrl("mx", 240), "https://flagcdn.com/w160/mx.png");
  assert.equal(teamFlagUrl("mx", 80), "https://flagcdn.com/w80/mx.png");
});

test("teamFlagCode resuelve México", () => {
  assert.equal(teamFlagCode("Mexico"), "mx");
});
