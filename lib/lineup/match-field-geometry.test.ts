import assert from "node:assert/strict";
import test from "node:test";
import { getFormationTemplateCoordinates } from "./formation-templates";
import { layoutPredictedStarters } from "./predicted-slot-layout";
import {
  mapSlotsToAwayHalf,
  mapSlotsToHomeHalf,
  MVP_AWAY_BOUNDS,
  MVP_HOME_BOUNDS,
} from "./match-field-geometry";

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

test("mapSlotsToAwayHalf coloca portero arriba del campo MVP", () => {
  const mapped = mapSlotsToAwayHalf([
    {
      key: "gk",
      name: "GK",
      shirtNumber: 1,
      positionLabel: "POR",
      role: "GK",
      isPlaceholder: false,
      x: 50,
      y: 78,
    },
  ]);

  assert.equal(mapped[0]!.y, 7);
});

test("mapSlotsToAwayHalf separa portero y defensa en bandas distintas", () => {
  const template = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const mapped = mapSlotsToAwayHalf(template);
  const gk = mapped.find((slot) => slot.role === "GK");
  const defenders = mapped.filter((slot) => slot.role === "DF");

  assert.ok(gk);
  for (const defender of defenders) {
    assert.ok(defender.y - gk!.y >= 5, `defensa demasiado cerca del portero (${defender.y})`);
    assert.ok(defender.y <= MVP_AWAY_BOUNDS.yMax);
    assert.ok(defender.y >= MVP_AWAY_BOUNDS.yMin);
  }
});

test("mapSlotsToHomeHalf mantiene delantero en mitad inferior", () => {
  const mapped = mapSlotsToHomeHalf([
    {
      key: "st",
      name: "ST",
      shirtNumber: 9,
      positionLabel: "DC",
      role: "FW",
      isPlaceholder: false,
      x: 50,
      y: 18,
    },
  ]);

  assert.equal(mapped[0]!.y, 71);
});

test("proyeccion MVP mantiene coords horizontales de plantilla", () => {
  const template = getFormationTemplateCoordinates("4-2-3-1");
  const slots = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const home = mapSlotsToHomeHalf(slots);

  assert.deepEqual(
    home.map((slot) => slot.x).sort((a, b) => a - b),
    template.map((coord) => coord.x).sort((a, b) => a - b)
  );
});

test("mapSlotsToHomeHalf respeta bounds del local", () => {
  const template = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const mapped = mapSlotsToHomeHalf(template);

  for (const slot of mapped) {
    assert.ok(slot.y >= MVP_HOME_BOUNDS.yMin);
    assert.ok(slot.y <= MVP_HOME_BOUNDS.yMax);
    assert.ok(slot.x >= MVP_HOME_BOUNDS.xMin);
    assert.ok(slot.x <= MVP_HOME_BOUNDS.xMax);
  }
});
