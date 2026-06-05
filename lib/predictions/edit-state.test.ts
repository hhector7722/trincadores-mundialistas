import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  displayGoals,
  formatListScore,
  NO_PREDICTION_LABEL,
} from "./edit-state";

describe("edit-state display", () => {
  it("sin pronostico muestra guion", () => {
    assert.equal(formatListScore(null, null), NO_PREDICTION_LABEL);
  });

  it("0-0 guardado se ve como 0-0", () => {
    assert.equal(displayGoals(0, 0), "0 - 0");
    assert.equal(formatListScore(0, 0), "0 - 0");
  });

  it("marcador guardado normal", () => {
    assert.equal(formatListScore(2, 1), "2 - 1");
  });
});