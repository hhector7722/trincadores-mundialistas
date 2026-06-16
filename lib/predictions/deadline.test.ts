import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatPredictionCountdown,
  predictionEditOpenHint,
  predictionLockDeadlineMs,
} from "./deadline";

describe("prediction deadline", () => {
  it("calcula cierre 5 min antes del pitido", () => {
    const kickoff = "2026-06-15T18:00:00.000Z";
    assert.equal(
      predictionLockDeadlineMs(kickoff),
      new Date("2026-06-15T17:55:00.000Z").getTime()
    );
  });

  it("formatea cuenta atras larga", () => {
    assert.equal(formatPredictionCountdown(2 * 86400000 + 5 * 3600000), "2d 5h");
  });

  it("formatea cuenta atras corta", () => {
    assert.equal(formatPredictionCountdown(90_000), "1m 30s");
    assert.equal(formatPredictionCountdown(0), "0s");
  });
});

describe("prediction edit copy", () => {
  it("diferencia plazo estandar y hasta pitido", () => {
    assert.match(predictionEditOpenHint(false), /5 minutos/);
    assert.match(predictionEditOpenHint(true), /inicio del partido/);
  });
});
