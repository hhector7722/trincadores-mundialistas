import assert from "node:assert/strict";
import test from "node:test";
import { TACTICAL_Y } from "./formation-coordinates";
import { getFormationTemplateCoordinates } from "./formation-templates";
import { layoutPredictedStarters } from "./predicted-slot-layout";
import {
  AWAY_HALF_X,
  HOME_HALF_X,
  compressCoordToAwayLeft,
  compressCoordToHomeRight,
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

test("compressCoordToAwayLeft coloca portero a la izquierda y delantero hacia el centro", () => {
  assert.deepEqual(compressCoordToAwayLeft({ x: 50, y: TACTICAL_Y.GOALKEEPER }), {
    x: 8,
    y: 50,
  });
  assert.deepEqual(compressCoordToAwayLeft({ x: 50, y: TACTICAL_Y.FORWARD }), {
    x: 46,
    y: 50,
  });
});

test("compressCoordToHomeRight coloca portero a la derecha y delantero hacia el centro", () => {
  assert.deepEqual(compressCoordToHomeRight({ x: 50, y: TACTICAL_Y.GOALKEEPER }), {
    x: 92,
    y: 50,
  });
  assert.deepEqual(compressCoordToHomeRight({ x: 50, y: TACTICAL_Y.FORWARD }), {
    x: 54,
    y: 50,
  });
});

test("mapSlotsToAwayLeft mantiene todos los jugadores en x < 50", () => {
  const template = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const mapped = mapSlotsToAwayLeft(template);

  for (const slot of mapped) {
    assert.ok(slot.x < 50, `${slot.slotKey} visitante invade mitad derecha (x=${slot.x})`);
    assert.ok(slot.x >= AWAY_HALF_X.MIN, `${slot.slotKey} demasiado a la izquierda (x=${slot.x})`);
    assert.ok(slot.x <= AWAY_HALF_X.MAX, `${slot.slotKey} demasiado cerca del centro (x=${slot.x})`);
  }
});

test("mapSlotsToHomeRight mantiene todos los jugadores en x > 50", () => {
  const template = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const mapped = mapSlotsToHomeRight(template);

  for (const slot of mapped) {
    assert.ok(slot.x > 50, `${slot.slotKey} local invade mitad izquierda (x=${slot.x})`);
    assert.ok(slot.x >= HOME_HALF_X.MIN, `${slot.slotKey} demasiado cerca del centro (x=${slot.x})`);
    assert.ok(slot.x <= HOME_HALF_X.MAX, `${slot.slotKey} demasiado a la derecha (x=${slot.x})`);
  }
});

test("proyección horizontal conserva spread lateral tras microajuste anti-solape", () => {
  const template = getFormationTemplateCoordinates("4-2-3-1");
  const slots = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const home = mapSlotsToHomeRight(slots);
  const away = mapSlotsToAwayLeft(slots);

  for (const mapped of [home, away]) {
    for (const slot of mapped) {
      assert.ok(slot.y >= 12 && slot.y <= 88, `${slot.slotKey} fuera de banda lateral`);
    }
    const ys = mapped.map((slot) => slot.y).sort((a, b) => a - b);
    const templateYs = template.map((coord) => coord.x).sort((a, b) => a - b);
    assert.equal(ys.length, templateYs.length);
    for (let i = 0; i < ys.length; i += 1) {
      assert.ok(
        Math.abs(ys[i]! - templateYs[i]!) <= 9,
        `desplazamiento lateral excesivo en índice ${i}`
      );
    }
  }
});
