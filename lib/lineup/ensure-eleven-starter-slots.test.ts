import assert from "node:assert/strict";
import test from "node:test";
import { getFormationCoordinates } from "./formation-templates";
import { ensureElevenStarterSlots } from "./ensure-eleven-starter-slots";
import type { ResolvedLineup } from "./types";

function baseLineup(slots: ResolvedLineup["slots"]): ResolvedLineup {
  return {
    formation: "4-3-3",
    formationLabel: "4-3-3",
    slots,
    benchCount: 0,
    isProbable: true,
    sourceKind: "fallback",
    dataSourceCode: null,
    fetchedAt: null,
  };
}

test("ensureElevenStarterSlots rellena hasta 11 titulares", () => {
  const lineup = baseLineup(
    Array.from({ length: 7 }, (_, index) => ({
      key: `p-${index}`,
      name: `Jugador ${index}`,
      shirtNumber: index + 1,
      positionLabel: "MC",
      role: index === 0 ? "GK" : ("MF" as const),
      isPlaceholder: false,
      slotKey: index === 0 ? "GK" : "CM",
      x: 50,
      y: 50,
    }))
  );

  const ensured = ensureElevenStarterSlots(lineup);
  assert.equal(ensured.length, 11);
});

test("ensureElevenStarterSlots delega coords fijas de plantilla", () => {
  const lineup = baseLineup(
    Array.from({ length: 11 }, (_, index) => ({
      key: `p-${index}`,
      name: `Jugador ${index}`,
      shirtNumber: index + 1,
      positionLabel: "MC",
      role: "MF" as const,
      isPlaceholder: false,
      slotKey: "CM",
      x: 50,
      y: 50,
    }))
  );

  const ensured = ensureElevenStarterSlots(lineup);
  assert.equal(ensured.length, 11);
  assert.deepEqual(
    ensured.map((slot) => ({ x: slot.x, y: slot.y })),
    getFormationCoordinates("4-3-3")
  );
});
