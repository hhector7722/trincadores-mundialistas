import assert from "node:assert/strict";
import test from "node:test";
import { TACTICAL_X, TACTICAL_Y } from "./formation-coordinates";
import { getFormationTemplateCoordinates } from "./formation-templates";
import { layoutPredictedStarters } from "./predicted-slot-layout";
import {
  AWAY_HALF_X,
  HOME_HALF_X,
  compressCoordToAwayRight,
  compressCoordToHomeLeft,
  mapSlotsToAwayRight,
  mapSlotsToHomeLeft,
  mirrorTacticalLateral,
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

test("compressCoordToHomeLeft coloca portero a la izquierda y delantero hacia el centro", () => {
  assert.deepEqual(compressCoordToHomeLeft({ x: 50, y: TACTICAL_Y.GOALKEEPER }), {
    x: 8,
    y: 50,
  });
  assert.deepEqual(compressCoordToHomeLeft({ x: 50, y: TACTICAL_Y.FORWARD }), {
    x: 46,
    y: 50,
  });
});

test("compressCoordToAwayRight coloca portero a la derecha y delantero hacia el centro", () => {
  assert.deepEqual(compressCoordToAwayRight({ x: 50, y: TACTICAL_Y.GOALKEEPER }), {
    x: 92,
    y: 50,
  });
  assert.deepEqual(compressCoordToAwayRight({ x: 50, y: TACTICAL_Y.FORWARD }), {
    x: 54,
    y: 50,
  });
});

test("mirrorTacticalLateral intercambia bandas izquierda y derecha", () => {
  assert.deepEqual(mirrorTacticalLateral({ x: TACTICAL_X.L, y: 50 }), {
    x: TACTICAL_X.R,
    y: 50,
  });
  assert.deepEqual(mirrorTacticalLateral({ x: TACTICAL_X.R, y: 50 }), {
    x: TACTICAL_X.L,
    y: 50,
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

test("local espejado: LB queda más cerca del centro que RB", () => {
  const template = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const mapped = mapSlotsToHomeLeft(template);
  const lb = mapped.find((slot) => slot.slotKey === "LB");
  const rb = mapped.find((slot) => slot.slotKey === "RB");

  assert.ok(lb && rb);
  assert.ok(lb.y > rb.y, "LB local debe quedar más abajo (hacia centro) que RB");
});

test("visitante espejado: RB queda más cerca del centro que LB", () => {
  const template = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const mapped = mapSlotsToAwayRight(template);
  const lb = mapped.find((slot) => slot.slotKey === "LB");
  const rb = mapped.find((slot) => slot.slotKey === "RB");

  assert.ok(lb && rb);
  assert.ok(rb.y < lb.y, "RB visitante debe quedar más arriba (hacia centro) que LB");
});

test("proyección horizontal: local y visitante espejan el spread lateral", () => {
  const template = getFormationTemplateCoordinates("4-2-3-1");
  const slots = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const home = mapSlotsToHomeLeft(slots);
  const away = mapSlotsToAwayRight(slots);
  const mirroredX = template.map((coord) => 100 - coord.x).sort((a, b) => a - b);

  assert.deepEqual(home.map((slot) => slot.y).sort((a, b) => a - b), mirroredX);
  assert.deepEqual(away.map((slot) => slot.y).sort((a, b) => a - b), mirroredX);
});
