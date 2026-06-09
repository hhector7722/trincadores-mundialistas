import assert from "node:assert/strict";
import test from "node:test";
import {
  refinePredictedSlotKey,
  swapMirroredDefenderSlots,
} from "./tactical-profile";

test("refinePredictedSlotKey corrige Laporte RB → CB", () => {
  assert.equal(
    refinePredictedSlotKey("Aymeric Laporte", "RB", "DF"),
    "CB"
  );
});

test("refinePredictedSlotKey corrige Porro CB → RB", () => {
  assert.equal(
    refinePredictedSlotKey("Pedro Porro", "CB", "DF"),
    "RB"
  );
});

test("swapMirroredDefenderSlots intercambia slots cruzados BSD", () => {
  const swapped = swapMirroredDefenderSlots([
    { name: "Aymeric Laporte", slotKey: "RB", squadPosition: "DF" },
    { name: "Pedro Porro", slotKey: "CB", squadPosition: "DF" },
  ]);

  assert.equal(swapped[0]!.slotKey, "CB");
  assert.equal(swapped[1]!.slotKey, "RB");
});
