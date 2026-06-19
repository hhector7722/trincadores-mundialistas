import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isMvpPredictionCorrect,
  mvpPlayerNamesMatch,
  mvpTeamsMatch,
  resolveStoredOfficialMvpPlayerName,
} from "@/lib/predictions/mvp-name-match";

test("mvpPlayerNamesMatch acepta Jr y Junior", () => {
  assert.equal(mvpPlayerNamesMatch("Vinicius Junior", "Vinicius Jr"), true);
  assert.equal(mvpPlayerNamesMatch("John Mcginn", "John McGinn"), true);
  assert.equal(mvpPlayerNamesMatch("Raphinha", "Vinicius Jr"), false);
});

test("isMvpPredictionCorrect usa alias Jr/Junior", () => {
  assert.equal(
    isMvpPredictionCorrect("Vinicius Junior", "Brazil", "Vinicius Jr", "Brazil"),
    true,
  );
});

test("resolveStoredOfficialMvpPlayerName prefiere etiqueta de porra", () => {
  const stored = resolveStoredOfficialMvpPlayerName("Vinicius Jr", [
    "Raphinha",
    "Vinicius Junior",
  ]);
  assert.equal(stored, "Vinicius Junior");
});

test("mvpTeamsMatch unifica Bosnia and Herzegovina", () => {
  assert.equal(mvpTeamsMatch("Bosnia & Herzegovina", "Bosnia and Herzegovina"), true);
});
