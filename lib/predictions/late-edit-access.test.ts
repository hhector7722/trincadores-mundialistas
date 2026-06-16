import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  predictionEditClosedMessage,
  predictionEditDeadlineMs,
  predictionEditOpenHint,
  predictionLockDeadlineMs,
} from "./deadline";
import { canEditPredictionsUntilKickoff } from "./late-edit-access";
import { computePredictionEditableLocally } from "./queries";

const kickoff = "2026-06-15T18:00:00.000Z";

describe("late edit access", () => {
  it("solo hector edita hasta el pitido", () => {
    assert.equal(canEditPredictionsUntilKickoff("hector"), true);
    assert.equal(canEditPredictionsUntilKickoff("Héctor"), true);
    assert.equal(canEditPredictionsUntilKickoff("aitor"), false);
  });
});

describe("prediction edit deadline", () => {
  it("cierre estandar T-5 min", () => {
    assert.equal(
      predictionLockDeadlineMs(kickoff),
      new Date("2026-06-15T17:55:00.000Z").getTime()
    );
    assert.equal(
      predictionEditDeadlineMs(kickoff, false),
      predictionLockDeadlineMs(kickoff)
    );
  });

  it("hector cierra al pitido", () => {
    assert.equal(predictionEditDeadlineMs(kickoff, true), new Date(kickoff).getTime());
  });

  it("compute local respeta untilKickoff", () => {
    const tMinus3 = new Date("2026-06-15T17:57:00.000Z").getTime();
    assert.equal(
      computePredictionEditableLocally("scheduled", kickoff, {
        nowMs: tMinus3,
        untilKickoff: false,
      }),
      false
    );
    assert.equal(
      computePredictionEditableLocally("scheduled", kickoff, {
        nowMs: tMinus3,
        untilKickoff: true,
      }),
      true
    );
  });

  it("mensajes de plazo segun modo", () => {
    assert.match(predictionEditOpenHint(false), /5 minutos/);
    assert.match(predictionEditOpenHint(true), /inicio del partido/);
    assert.match(predictionEditClosedMessage(true), /inicio del partido/);
  });
});
