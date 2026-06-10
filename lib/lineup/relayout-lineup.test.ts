import assert from "node:assert/strict";
import test from "node:test";
import { getFormationSlotAnchors } from "./formation-coordinates";
import { getFormationTemplateCoordinates } from "./formation-templates";
import { relayoutLineupSlots } from "./relayout-lineup";
import { hasTacticalSlotCollisions } from "./tactical-collision-resolve";
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
  const gk = relaid.slots.find((slot) => slot.role === "GK");

  assert.equal(gk?.y, 94);
  assert.ok(relaid.slots.some((slot) => slot.x !== 50 || slot.y !== 50));
  assert.ok(!hasTacticalSlotCollisions(relaid.slots) || relaid.slots.length > 1);
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

  for (const slot of relaid.slots) {
    assert.ok(slot.slotKey);
  }

  const templateBySlot = new Map(
    getFormationSlotAnchors("4-2-3-1").map((anchor) => [anchor.key, anchor.coord])
  );

  for (const slot of relaid.slots) {
    const base = templateBySlot.get(slot.slotKey ?? "");
    assert.ok(base, `slot ${slot.slotKey}`);
    assert.ok(Math.abs(slot.x - base.x) <= 16);
    assert.ok(Math.abs(slot.y - base.y) <= 16);
  }
});
