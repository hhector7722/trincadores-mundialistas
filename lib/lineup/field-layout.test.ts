import assert from "node:assert/strict";
import test from "node:test";
import { separateOverlappingSlots } from "./field-layout";

test("separateOverlappingSlots separa fichas en la misma coordenada", () => {
  const base = {
    name: "Test",
    shirtNumber: 1,
    positionLabel: "MED",
    role: "MF" as const,
    isPlaceholder: false,
  };

  const separated = separateOverlappingSlots([
    { ...base, key: "a", x: 50, y: 50 },
    { ...base, key: "b", x: 50, y: 50 },
  ]);

  assert.notEqual(separated[0]!.x, separated[1]!.x);
});
