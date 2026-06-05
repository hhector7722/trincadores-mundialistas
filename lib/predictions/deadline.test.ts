import { describe, expect, it } from "vitest";
import { formatPredictionCountdown, predictionLockDeadlineMs } from "./deadline";

describe("prediction deadline", () => {
  it("calcula cierre 5 min antes del pitido", () => {
    const kickoff = "2026-06-15T18:00:00.000Z";
    expect(predictionLockDeadlineMs(kickoff)).toBe(
      new Date("2026-06-15T17:55:00.000Z").getTime()
    );
  });

  it("formatea cuenta atras larga", () => {
    expect(formatPredictionCountdown(2 * 86400000 + 5 * 3600000)).toBe("2d 5h");
  });

  it("formatea cuenta atras corta", () => {
    expect(formatPredictionCountdown(90_000)).toBe("1m 30s");
    expect(formatPredictionCountdown(0)).toBe("0s");
  });
});
