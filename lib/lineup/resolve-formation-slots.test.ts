import assert from "node:assert/strict";
import test from "node:test";
import { FORMATION_IDS } from "@/lib/lineup/formation-coordinates";
import { formationRoleCounts } from "@/lib/lineup/position-map";
import { getFormationCoordinates } from "@/lib/lineup/formation-templates";
import {
  resolveFormationSlots,
  resolveFormationSlotsFromLineup,
  resolveFormationSlotsFromStarters,
} from "@/lib/lineup/resolve-formation-slots";
import type { FormationId, LineupPlayerInput, ResolvedLineup } from "@/lib/lineup/types";

const SPAIN_4231 = [
  { slotKey: "GK", role: "GK" as const, key: "gk", name: "GK", shirtNumber: 1, positionLabel: "POR", isPlaceholder: false },
  { slotKey: "LB", role: "DF" as const, key: "lb", name: "LB", shirtNumber: 2, positionLabel: "LI", isPlaceholder: false },
  { slotKey: "CB", role: "DF" as const, key: "cb1", name: "CB1", shirtNumber: 3, positionLabel: "DFC", isPlaceholder: false },
  { slotKey: "CB", role: "DF" as const, key: "cb2", name: "CB2", shirtNumber: 4, positionLabel: "DFC", isPlaceholder: false },
  { slotKey: "RB", role: "DF" as const, key: "rb", name: "RB", shirtNumber: 5, positionLabel: "LD", isPlaceholder: false },
  { slotKey: "DM", role: "MF" as const, key: "dm1", name: "DM1", shirtNumber: 6, positionLabel: "MCD", isPlaceholder: false },
  { slotKey: "DM", role: "MF" as const, key: "dm2", name: "DM2", shirtNumber: 7, positionLabel: "MCD", isPlaceholder: false },
  { slotKey: "LW", role: "MF" as const, key: "lw", name: "LW", shirtNumber: 8, positionLabel: "EI", isPlaceholder: false },
  { slotKey: "AM", role: "MF" as const, key: "am", name: "AM", shirtNumber: 10, positionLabel: "MP", isPlaceholder: false },
  { slotKey: "RW", role: "MF" as const, key: "rw", name: "RW", shirtNumber: 11, positionLabel: "ED", isPlaceholder: false },
  { slotKey: "ST", role: "FW" as const, key: "st", name: "ST", shirtNumber: 9, positionLabel: "DC", isPlaceholder: false },
];

function mockPlayersFor(formation: FormationId): LineupPlayerInput[] {
  const counts = formationRoleCounts(formation);
  const players: LineupPlayerInput[] = [];
  let shirt = 1;

  for (let i = 0; i < counts.GK; i += 1) {
    players.push({ player_name: `GK ${i}`, position: "GK", shirt_number: shirt++ });
  }
  for (let i = 0; i < counts.DF; i += 1) {
    players.push({ player_name: `DF ${i}`, position: "DF", shirt_number: shirt++ });
  }
  for (let i = 0; i < counts.MF; i += 1) {
    players.push({ player_name: `MF ${i}`, position: "MF", shirt_number: shirt++ });
  }
  for (let i = 0; i < counts.FW; i += 1) {
    players.push({ player_name: `FW ${i}`, position: "FW", shirt_number: shirt++ });
  }
  for (let i = 0; i < 8; i += 1) {
    players.push({ player_name: `Bench ${i}`, position: "MF", shirt_number: shirt++ });
  }

  return players;
}

for (const formation of FORMATION_IDS) {
  test(`resolveFormationSlots mantiene plantilla fija en ${formation}`, () => {
    const slots = resolveFormationSlots(mockPlayersFor(formation), formation);
    const expected = getFormationCoordinates(formation);
    assert.deepEqual(
      slots.map((slot) => ({ x: slot.x, y: slot.y })),
      expected
    );
  });
}

test("resolveFormationSlotsFromStarters ignora x/y stale de caché", () => {
  const stale = SPAIN_4231.map((row) => ({ ...row, x: 12, y: 88 }));
  const resolved = resolveFormationSlotsFromStarters(stale, "4-2-3-1");
  assert.deepEqual(
    resolved.map((slot) => ({ x: slot.x, y: slot.y })),
    getFormationCoordinates("4-2-3-1")
  );
});

test("resolveFormationSlotsFromLineup fuerza coords de plantilla", () => {
  const lineup: ResolvedLineup = {
    formation: "4-3-3",
    formationLabel: "4-3-3",
    slots: SPAIN_4231.map((row, index) => ({
      ...row,
      x: 50,
      y: 50,
      key: `p-${index}`,
      role: index === 10 ? "FW" : row.role,
    })),
    benchCount: 0,
    isProbable: true,
    sourceKind: "predicted",
    dataSourceCode: "bsd",
    fetchedAt: null,
  };

  const resolved = resolveFormationSlotsFromLineup({
    ...lineup,
    formationLabel: "4-2-3-1",
    formation: "4-2-3-1",
  });

  assert.deepEqual(
    resolved.map((slot) => ({ x: slot.x, y: slot.y })),
    getFormationCoordinates("4-2-3-1")
  );
});

test("resolveFormationSlotsFromStarters rellena placeholders sin pool.shift", () => {
  const resolved = resolveFormationSlotsFromStarters(SPAIN_4231.slice(0, 7), "4-2-3-1");
  assert.equal(resolved.length, 11);
  assert.deepEqual(
    resolved.map((slot) => ({ x: slot.x, y: slot.y })),
    getFormationCoordinates("4-2-3-1")
  );
  assert.equal(resolved.filter((slot) => slot.isPlaceholder).length, 4);
});
