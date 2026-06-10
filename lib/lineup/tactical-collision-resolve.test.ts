import assert from "node:assert/strict";
import test from "node:test";
import { layoutPredictedStarters } from "./predicted-slot-layout";
import {
  hasTacticalSlotCollisions,
  MATCH_CHIP_FOOTPRINT,
  MVP_FIELD_EFFECTIVE_CHIP_SCALE,
  resolveTacticalSlotCollisions,
  scaleChipFootprint,
} from "./tactical-collision-resolve";
import { SINGLE_TEAM_BOUNDS } from "./field-layout";
import {
  AWAY_HALF_X,
  compressCoordToAwayLeft,
  HOME_HALF_X,
  mapSlotsToAwayLeft,
  mapSlotsToHomeRight,
} from "./mvp-horizontal-geometry";

const SPAIN_4231 = [
  { slotKey: "GK", role: "GK" as const },
  { slotKey: "LB", role: "DF" as const },
  { slotKey: "LCB", role: "DF" as const },
  { slotKey: "RCB", role: "DF" as const },
  { slotKey: "RB", role: "DF" as const },
  { slotKey: "LDM", role: "MF" as const },
  { slotKey: "RDM", role: "MF" as const },
  { slotKey: "LW", role: "MF" as const },
  { slotKey: "AM", role: "MF" as const },
  { slotKey: "RW", role: "MF" as const },
  { slotKey: "ST", role: "FW" as const },
];

const HORIZONTAL_FOOTPRINT = scaleChipFootprint(
  MATCH_CHIP_FOOTPRINT,
  MVP_FIELD_EFFECTIVE_CHIP_SCALE
);

function countCollisionPairs(slots: ReturnType<typeof layoutPredictedStarters>, footprint = HORIZONTAL_FOOTPRINT) {
  let pairs = 0;
  for (let i = 0; i < slots.length; i += 1) {
    for (let j = i + 1; j < slots.length; j += 1) {
      if (hasTacticalSlotCollisions([slots[i]!, slots[j]!], footprint)) pairs += 1;
    }
  }
  return pairs;
}

test("resolveTacticalSlotCollisions reduce solapes en 4-2-3-1 horizontal", () => {
  const starters = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const raw = starters.map((slot) => ({ ...slot, ...compressCoordToAwayLeft(slot) }));
  const away = mapSlotsToAwayLeft(starters);

  assert.ok(countCollisionPairs(raw) > countCollisionPairs(away));
});

test("resolveTacticalSlotCollisions mantiene portero anclado en línea de gol horizontal", () => {
  const starters = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const awayGk = mapSlotsToAwayLeft(starters).find((slot) => slot.slotKey === "GK");
  const homeGk = mapSlotsToHomeRight(starters).find((slot) => slot.slotKey === "GK");

  assert.equal(awayGk?.x, AWAY_HALF_X.MIN);
  assert.equal(homeGk?.x, HOME_HALF_X.MAX);
});

test("resolveTacticalSlotCollisions limita desplazamiento respecto a la base", () => {
  const starters = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const raw = starters.map((slot) => ({ ...slot }));
  const resolved = resolveTacticalSlotCollisions(raw, {
    bounds: SINGLE_TEAM_BOUNDS,
    mode: "master",
    maxNudge: 12,
  });

  for (let i = 0; i < starters.length; i += 1) {
    const base = starters[i]!;
    const next = resolved[i]!;
    assert.ok(Math.abs(next.x - base.x) <= 16.01, `${base.slotKey} x desplazado de más`);
    assert.ok(Math.abs(next.y - base.y) <= 16.01, `${base.slotKey} y desplazado de más`);
  }
});

test("separación manual de coordenadas idénticas mejora legibilidad", () => {
  const base = {
    name: "Test",
    shirtNumber: 1,
    positionLabel: "MED",
    role: "MF" as const,
    isPlaceholder: false,
    slotKey: "CM",
  };

  const stacked = [
    { ...base, key: "a", x: 50, y: 50 },
    { ...base, key: "b", x: 50, y: 50 },
  ];

  const resolved = resolveTacticalSlotCollisions(stacked, {
    bounds: SINGLE_TEAM_BOUNDS,
    mode: "master",
    maxNudge: 14,
  });

  assert.ok(
    resolved[0]!.x !== resolved[1]!.x || resolved[0]!.y !== resolved[1]!.y,
    "deben separarse en al menos un eje"
  );
  assert.ok(
    countCollisionPairs(resolved, MATCH_CHIP_FOOTPRINT) <
      countCollisionPairs(stacked, MATCH_CHIP_FOOTPRINT)
  );
});
