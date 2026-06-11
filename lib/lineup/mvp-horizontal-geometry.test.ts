import assert from "node:assert/strict";
import test from "node:test";
import { TACTICAL_Y } from "./formation-coordinates";
import { getFormationTemplateCoordinates } from "./formation-templates";
import { layoutPredictedStarters } from "./predicted-slot-layout";
import { FORMATION_IDS } from "./formation-coordinates";
import { resolveFormationSlots } from "./resolve-formation-slots";
import type { LineupPlayerInput } from "./types";
import {
  AWAY_HALF_X,
  HOME_HALF_X,
  PLAYABLE_Y_MAX,
  PLAYABLE_Y_MIN,
  compressCoordToAwayRight,
  compressCoordToHomeLeft,
  mapLateralToPlayableY,
  mapSlotsToAwayRight,
  mapSlotsToHomeLeft,
  type MvpHorizontalSlot,
} from "./mvp-horizontal-geometry";

const MIN_GAP_X = 10;
const MIN_GAP_Y = 6.5;

function slotsOverlap(a: MvpHorizontalSlot, b: MvpHorizontalSlot): boolean {
  return Math.abs(a.x - b.x) < MIN_GAP_X && Math.abs(a.y - b.y) < MIN_GAP_Y;
}

function assertNoOverlaps(slots: MvpHorizontalSlot[], label: string) {
  for (let i = 0; i < slots.length; i += 1) {
    for (let j = i + 1; j < slots.length; j += 1) {
      assert.equal(
        slotsOverlap(slots[i]!, slots[j]!),
        false,
        `${label}: ${slots[i]!.slotKey} y ${slots[j]!.slotKey} se solapan`
      );
    }
  }
}

function dummySquad(): LineupPlayerInput[] {
  return Array.from({ length: 23 }, (_, index) => ({
    player_name: `Jugador ${index + 1}`,
    shirt_number: index + 1,
    position: index === 0 ? "GK" : index < 5 ? "DF" : index < 9 ? "MF" : "FW",
  }));
}

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

test("compressCoordToHomeLeft coloca portero a la izquierda y delantero hacia el centro", () => {
  assert.deepEqual(compressCoordToHomeLeft({ x: 50, y: TACTICAL_Y.GOALKEEPER }), {
    x: 8,
    y: 49,
  });
  assert.deepEqual(compressCoordToHomeLeft({ x: 50, y: TACTICAL_Y.FORWARD }), {
    x: 46,
    y: 49,
  });
});

test("compressCoordToAwayRight coloca portero a la derecha y delantero hacia el centro", () => {
  assert.deepEqual(compressCoordToAwayRight({ x: 50, y: TACTICAL_Y.GOALKEEPER }), {
    x: 92,
    y: 49,
  });
  assert.deepEqual(compressCoordToAwayRight({ x: 50, y: TACTICAL_Y.FORWARD }), {
    x: 54,
    y: 49,
  });
});

test("mapSlotsToHomeLeft mantiene todos los jugadores en x < 50", () => {
  const template = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const mapped = mapSlotsToHomeLeft(template);

  for (const slot of mapped) {
    assert.ok(slot.x < 50, `${slot.slotKey} local invade mitad derecha (x=${slot.x})`);
    assert.ok(slot.x >= HOME_HALF_X.MIN, `${slot.slotKey} demasiado a la izquierda (x=${slot.x})`);
    assert.ok(slot.x <= HOME_HALF_X.MAX, `${slot.slotKey} demasiado cerca del centro (x=${slot.x})`);
  }
});

test("mapSlotsToAwayRight mantiene todos los jugadores en x > 50", () => {
  const template = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const mapped = mapSlotsToAwayRight(template);

  for (const slot of mapped) {
    assert.ok(slot.x > 50, `${slot.slotKey} visitante invade mitad izquierda (x=${slot.x})`);
    assert.ok(slot.x >= AWAY_HALF_X.MIN, `${slot.slotKey} demasiado cerca del centro (x=${slot.x})`);
    assert.ok(slot.x <= AWAY_HALF_X.MAX, `${slot.slotKey} demasiado a la derecha (x=${slot.x})`);
  }
});

test("lateral del slot BSD se conserva al proyectar (LB arriba de RB)", () => {
  const template = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  for (const mapFn of [mapSlotsToHomeLeft, mapSlotsToAwayRight] as const) {
    const mapped = mapFn(template);
    const lb = mapped.find((slot) => slot.slotKey === "LB");
    const rb = mapped.find((slot) => slot.slotKey === "RB");
    assert.ok(lb && rb);
    assert.ok(lb.y < rb.y, `${mapFn.name}: LB debe quedar en banda superior a RB`);
  }
});

test("slots laterales no tocan el borde vertical del campo", () => {
  const template = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  for (const mapFn of [mapSlotsToHomeLeft, mapSlotsToAwayRight] as const) {
    const mapped = mapFn(template);
    for (const slot of mapped) {
      assert.ok(
        slot.y >= PLAYABLE_Y_MIN && slot.y <= PLAYABLE_Y_MAX,
        `${slot.slotKey} fuera de zona segura (y=${slot.y})`
      );
    }
  }
});

test("mapLateralToPlayableY conserva el orden lateral de la plantilla", () => {
  const template = getFormationTemplateCoordinates("4-2-3-1");
  for (let i = 0; i < template.length; i += 1) {
    for (let j = i + 1; j < template.length; j += 1) {
      const a = template[i]!;
      const b = template[j]!;
      const mappedA = mapLateralToPlayableY(a.x);
      const mappedB = mapLateralToPlayableY(b.x);
      if (a.x < b.x) assert.ok(mappedA < mappedB);
      if (a.x > b.x) assert.ok(mappedA > mappedB);
    }
  }
});

test("mapLateralToPlayableY distribuye laterales sin colapsar al borde", () => {
  assert.equal(mapLateralToPlayableY(10), PLAYABLE_Y_MIN);
  assert.equal(mapLateralToPlayableY(90), PLAYABLE_Y_MAX);
  assert.ok(mapLateralToPlayableY(25) > mapLateralToPlayableY(10) + 5);
  assert.ok(mapLateralToPlayableY(90) > mapLateralToPlayableY(75) + 5);
});

test("todas las formaciones caben en el campo sin solapes en ambas mitades", () => {
  const squad = dummySquad();
  for (const formationId of FORMATION_IDS) {
    const slots = resolveFormationSlots(squad, formationId);
    const home = mapSlotsToHomeLeft(slots);
    const away = mapSlotsToAwayRight(slots);

    for (const slot of [...home, ...away]) {
      assert.ok(
        slot.y >= PLAYABLE_Y_MIN && slot.y <= PLAYABLE_Y_MAX,
        `${formationId} ${slot.slotKey} fuera de zona segura (y=${slot.y})`
      );
    }

    assertNoOverlaps(home, `${formationId} local`);
    assertNoOverlaps(away, `${formationId} visitante`);
  }
});
