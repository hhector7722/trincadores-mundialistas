import assert from "node:assert/strict";
import test from "node:test";
import { getFormationTemplateCoordinates } from "./formation-templates";
import { layoutPredictedStarters } from "./predicted-slot-layout";
import {
  mapSlotsToAwayHalf,
  mapSlotsToHomeHalf,
  mirrorCoordVertical,
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

test("mirrorCoordVertical invierte sobre el eje central del campo", () => {
  assert.deepEqual(mirrorCoordVertical({ x: 50, y: 92 }), { x: 50, y: 8 });
  assert.deepEqual(mirrorCoordVertical({ x: 15, y: 22 }), { x: 15, y: 78 });
  assert.deepEqual(mirrorCoordVertical(mirrorCoordVertical({ x: 35, y: 60 })), { x: 35, y: 60 });
});

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
      y: 92,
    },
  ]);

  assert.equal(mapped[0]!.y, 8);
});

test("mapSlotsToAwayHalf refleja la plantilla maestra", () => {
  const template = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const mapped = mapSlotsToAwayHalf(template);

  assert.deepEqual(
    mapped.map((slot) => ({ x: slot.x, y: slot.y })).sort((a, b) => a.y - b.y || a.x - b.x),
    template
      .map((slot) => mirrorCoordVertical(slot))
      .sort((a, b) => a.y - b.y || a.x - b.x)
  );
});

test("mapSlotsToHomeHalf conserva coordenadas maestras", () => {
  const template = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const mapped = mapSlotsToHomeHalf(template);

  assert.deepEqual(
    mapped.map((slot) => ({ x: slot.x, y: slot.y })).sort((a, b) => a.y - b.y || a.x - b.x),
    template.map((slot) => ({ x: slot.x, y: slot.y })).sort((a, b) => a.y - b.y || a.x - b.x)
  );
});

test("mapSlotsToHomeHalf mantiene delantero en posición maestra", () => {
  const mapped = mapSlotsToHomeHalf([
    {
      key: "st",
      name: "ST",
      shirtNumber: 9,
      positionLabel: "DC",
      role: "FW",
      isPlaceholder: false,
      x: 50,
      y: 20,
    },
  ]);

  assert.equal(mapped[0]!.y, 20);
});

test("proyeccion MVP mantiene coords horizontales de plantilla", () => {
  const template = getFormationTemplateCoordinates("4-2-3-1");
  const slots = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const home = mapSlotsToHomeHalf(slots);
  const away = mapSlotsToAwayHalf(slots);

  assert.deepEqual(
    home.map((slot) => slot.x).sort((a, b) => a - b),
    template.map((coord) => coord.x).sort((a, b) => a - b)
  );
  assert.deepEqual(
    away.map((slot) => slot.x).sort((a, b) => a - b),
    template.map((coord) => coord.x).sort((a, b) => a - b)
  );
});

test("ambos equipos son simétricos respecto a y=50", () => {
  const template = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const home = mapSlotsToHomeHalf(template);
  const away = mapSlotsToAwayHalf(template);
  const awayBySlotKey = new Map(away.map((slot) => [slot.slotKey, slot]));

  for (const h of home) {
    const a = awayBySlotKey.get(h.slotKey);
    assert.ok(a, `falta slot visitante para ${h.slotKey}`);
    assert.equal(h.x, a.x);
    assert.equal(h.y + a.y, 100, `slot ${h.slotKey}: home y=${h.y}, away y=${a.y}`);
  }
});
