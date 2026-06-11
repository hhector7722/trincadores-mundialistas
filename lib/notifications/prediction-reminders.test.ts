import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PREDICTION_REMINDER_CRON_INTERVAL_MS,
  PREDICTION_REMINDER_MINUTES,
  buildPredictionReminderCopy,
  isPredictionReminderDue,
} from "./prediction-reminders";

describe("prediction reminders", () => {
  it("isPredictionReminderDue es true en la ventana T-30", () => {
    const kickoff = new Date("2026-06-15T20:00:00.000Z");
    const reminderAt = kickoff.getTime() - PREDICTION_REMINDER_MINUTES * 60 * 1000;
    const now = new Date(reminderAt + 60_000);

    assert.equal(
      isPredictionReminderDue(kickoff.toISOString(), now.getTime(), PREDICTION_REMINDER_CRON_INTERVAL_MS),
      true,
    );
  });

  it("isPredictionReminderDue es false fuera de la ventana del cron", () => {
    const kickoff = new Date("2026-06-15T20:00:00.000Z");
    const reminderAt = kickoff.getTime() - PREDICTION_REMINDER_MINUTES * 60 * 1000;
    const tooEarly = new Date(reminderAt - 60_000);
    const tooLate = new Date(reminderAt + PREDICTION_REMINDER_CRON_INTERVAL_MS + 60_000);

    assert.equal(
      isPredictionReminderDue(kickoff.toISOString(), tooEarly.getTime(), PREDICTION_REMINDER_CRON_INTERVAL_MS),
      false,
    );
    assert.equal(
      isPredictionReminderDue(kickoff.toISOString(), tooLate.getTime(), PREDICTION_REMINDER_CRON_INTERVAL_MS),
      false,
    );
  });

  it("buildPredictionReminderCopy usa mensaje generico con plazo T-5", () => {
    const copy = buildPredictionReminderCopy("España", "Brasil");
    assert.equal(
      copy.body,
      "Faltan 30 minutos para España vs Brasil. Completa tu predicción hasta 5 minutos antes de que empiece.",
    );
  });
});
