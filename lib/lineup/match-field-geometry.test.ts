import assert from "node:assert/strict";
import test from "node:test";
import { TACTICAL_Y } from "./formation-coordinates";
import { getFormationTemplateCoordinates } from "./formation-templates";
import { layoutPredictedStarters } from "./predicted-slot-layout";
import {
  AWAY_HALF_Y,
  HOME_HALF_Y,
  compressCoordToAwayHalf,
  compressCoordToHomeHalf,
  mapSlotsToAwayHalf,
  mapSlotsToHomeHalf,
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

test("compressCoordToAwayHalf mapea ST y GK al rango superior", () => {
  assert.deepEqual(compressCoordToAwayHalf({ x: 50, y: TACTICAL_Y.FORWARD }), { x: 50, y: 40 });
  assert.deepEqual(compressCoordToAwayHalf({ x: 50, y: TACTICAL_Y.GOALKEEPER }), { x: 50, y: 10 });
});

test("compressCoordToHomeHalf mapea ST y GK al rango inferior", () => {
  assert.deepEqual(compressCoordToHomeHalf({ x: 50, y: TACTICAL_Y.FORWARD }), { x: 50, y: 60 });
  assert.deepEqual(compressCoordToHomeHalf({ x: 50, y: TACTICAL_Y.GOALKEEPER }), { x: 50, y: 90 });
});

test("mapSlotsToAwayHalf mantiene todos los jugadores en y < 50", () => {
  const template = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const mapped = mapSlotsToAwayHalf(template);

  for (const slot of mapped) {
    assert.ok(slot.y < 50, `${slot.slotKey} visitante invade mitad inferior (y=${slot.y})`);
    assert.ok(slot.y >= AWAY_HALF_Y.MIN, `${slot.slotKey} demasiado arriba (y=${slot.y})`);
    assert.ok(slot.y <= AWAY_HALF_Y.MAX, `${slot.slotKey} demasiado cerca del centro (y=${slot.y})`);
  }
});

test("mapSlotsToHomeHalf mantiene todos los jugadores en y > 50", () => {
  const template = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const mapped = mapSlotsToHomeHalf(template);

  for (const slot of mapped) {
    assert.ok(slot.y > 50, `${slot.slotKey} local invade mitad superior (y=${slot.y})`);
    assert.ok(slot.y >= HOME_HALF_Y.MIN, `${slot.slotKey} demasiado cerca del centro (y=${slot.y})`);
    assert.ok(slot.y <= HOME_HALF_Y.MAX, `${slot.slotKey} demasiado abajo (y=${slot.y})`);
  }
});

test("delanteros quedan enfrentados cerca de la linea central", () => {
  const template = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const away = mapSlotsToAwayHalf(template);
  const home = mapSlotsToHomeHalf(template);
  const awaySt = away.find((slot) => slot.slotKey === "ST");
  const homeSt = home.find((slot) => slot.slotKey === "ST");

  assert.ok(awaySt && homeSt);
  assert.equal(awaySt.y, 40);
  assert.equal(homeSt.y, 60);
  assert.ok(homeSt.y - awaySt.y >= 15);
});

test("porteros quedan junto a sus porterias", () => {
  const template = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const awayGk = mapSlotsToAwayHalf(template).find((slot) => slot.slotKey === "GK");
  const homeGk = mapSlotsToHomeHalf(template).find((slot) => slot.slotKey === "GK");

  assert.equal(awayGk?.y, 10);
  assert.equal(homeGk?.y, 90);
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
