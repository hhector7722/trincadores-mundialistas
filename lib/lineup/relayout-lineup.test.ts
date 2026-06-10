import assert from "node:assert/strict";
import test from "node:test";
import { getFormationTemplateCoordinates } from "./formation-templates";
import { relayoutLineupSlots } from "./relayout-lineup";
import type { LineupSlot, ResolvedLineup } from "./types";

function legacyLineup(slots: Omit<LineupSlot, "slotKey">[]): ResolvedLineup {
  return {
    formation: "4-3-3",
    formationLabel: "4-3-3",
    slots: slots as LineupSlot[],
    benchCount: 0,
    isProbable: true,
    sourceKind: "predicted",
    dataSourceCode: "bsd",
    fetchedAt: null,
  };
}

test("relayoutLineupSlots corrige coords antiguas en caché sin slotKey", () => {
  const template = getFormationTemplateCoordinates("4-3-3");
  const stale = legacyLineup(
    template.map((coord, index) => ({
      key: `p-${index}`,
      name: `Jugador ${index}`,
      shirtNumber: index + 1,
      positionLabel: "MC",
      role: index === 0 ? "GK" : index < 5 ? "DF" : index < 8 ? "MF" : "FW",
      isPlaceholder: false,
      x: 50,
      y: 50,
    }))
  );

  const relaid = relayoutLineupSlots(stale);
  assert.deepEqual(
    relaid.slots.map((slot) => ({ x: slot.x, y: slot.y })),
    template
  );
});

test("relayoutLineupSlots preserva slotKey y normaliza geometría", () => {
  const spain4231 = [
    { slotKey: "GK", role: "GK" as const, x: 10, y: 10 },
    { slotKey: "LB", role: "DF" as const, x: 10, y: 10 },
    { slotKey: "LCB", role: "DF" as const, x: 10, y: 10 },
    { slotKey: "RCB", role: "DF" as const, x: 10, y: 10 },
    { slotKey: "RB", role: "DF" as const, x: 10, y: 10 },
    { slotKey: "LDM", role: "MF" as const, x: 10, y: 10 },
    { slotKey: "RDM", role: "MF" as const, x: 10, y: 10 },
    { slotKey: "LW", role: "MF" as const, x: 10, y: 10 },
    { slotKey: "AM", role: "MF" as const, x: 10, y: 10 },
    { slotKey: "RW", role: "MF" as const, x: 10, y: 10 },
    { slotKey: "ST", role: "FW" as const, x: 10, y: 10 },
  ].map((row, index) => ({
    key: `p-${index}`,
    name: `Jugador ${index}`,
    shirtNumber: index + 1,
    positionLabel: row.slotKey,
    isPlaceholder: false,
    ...row,
  }));

  const relaid = relayoutLineupSlots({
    formation: "4-3-3",
    formationLabel: "4-2-3-1",
    slots: spain4231,
    benchCount: 0,
    isProbable: true,
    sourceKind: "predicted",
    dataSourceCode: "bsd",
    fetchedAt: null,
  });

  assert.deepEqual(
    relaid.slots.map((slot) => ({ x: slot.x, y: slot.y })).sort((a, b) => a.y - b.y || a.x - b.x),
    getFormationTemplateCoordinates("4-2-3-1").sort((a, b) => a.y - b.y || a.x - b.x)
  );
});
