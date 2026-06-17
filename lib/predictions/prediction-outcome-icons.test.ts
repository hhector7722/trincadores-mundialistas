import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolvePredictionOutcomeIcons } from "./prediction-outcome-icons";

describe("resolvePredictionOutcomeIcons", () => {
  it("signo solo", () => {
    assert.deepEqual(
      resolvePredictionOutcomeIcons({
        scoreOutcome: "sign",
        mvpCorrect: false,
        showMissIndicator: true,
      }),
      ["success"],
    );
  });

  it("exacto (signo + marcador)", () => {
    assert.deepEqual(
      resolvePredictionOutcomeIcons({
        scoreOutcome: "exact",
        mvpCorrect: false,
        showMissIndicator: true,
      }),
      ["success", "success"],
    );
  });

  it("signo y mvp", () => {
    assert.deepEqual(
      resolvePredictionOutcomeIcons({
        scoreOutcome: "sign",
        mvpCorrect: true,
        showMissIndicator: true,
      }),
      ["success", "mvp"],
    );
  });

  it("exacto y mvp", () => {
    assert.deepEqual(
      resolvePredictionOutcomeIcons({
        scoreOutcome: "exact",
        mvpCorrect: true,
        showMissIndicator: true,
      }),
      ["success", "success", "mvp"],
    );
  });

  it("fallo total", () => {
    assert.deepEqual(
      resolvePredictionOutcomeIcons({
        scoreOutcome: "miss",
        mvpCorrect: false,
        showMissIndicator: true,
      }),
      ["error"],
    );
  });

  it("fallo marcador pero mvp", () => {
    assert.deepEqual(
      resolvePredictionOutcomeIcons({
        scoreOutcome: "miss",
        mvpCorrect: true,
        showMissIndicator: true,
      }),
      ["error", "mvp"],
    );
  });

  it("tablero sin cruz ni tick de signo", () => {
    assert.deepEqual(
      resolvePredictionOutcomeIcons({
        scoreOutcome: "miss",
        mvpCorrect: false,
        showMissIndicator: false,
        showSignOutcomeTicks: false,
      }),
      [],
    );
  });
});
