import assert from "node:assert/strict";
import test from "node:test";
import {
  assignFormationTemplateCoordinates,
  getFormationTemplateCoordinates,
  normalizeFormationTemplate,
} from "./formation-templates";
import { layoutPredictedStarters } from "./predicted-slot-layout";

const SPAIN_4231 = [
  { slotKey: "GK", role: "GK" as const },
  { slotKey: "LB", role: "DF" as const },
  { slotKey: "CB", role: "DF" as const },
  { slotKey: "CB", role: "DF" as const },
  { slotKey: "RB", role: "DF" as const },
  { slotKey: "DM", role: "MF" as const },
  { slotKey: "DM", role: "MF" as const },
  { slotKey: "LW", role: "MF" as const },
  { slotKey: "AM", role: "MF" as const },
  { slotKey: "RW", role: "MF" as const },
  { slotKey: "ST", role: "FW" as const },
];

const MEXICO_433 = [
  { slotKey: "GK", role: "GK" as const },
  { slotKey: "LB", role: "DF" as const },
  { slotKey: "CB", role: "DF" as const },
  { slotKey: "CB", role: "DF" as const },
  { slotKey: "RB", role: "DF" as const },
  { slotKey: "CM", role: "MF" as const },
  { slotKey: "CM", role: "MF" as const },
  { slotKey: "CM", role: "MF" as const },
  { slotKey: "LW", role: "MF" as const },
  { slotKey: "ST", role: "FW" as const },
  { slotKey: "RW", role: "MF" as const },
];

test("normalizeFormationTemplate reconoce variantes BSD", () => {
  assert.equal(normalizeFormationTemplate("4-2-3-1"), "4-2-3-1");
  assert.equal(normalizeFormationTemplate("4-4-2"), "4-4-2");
  assert.equal(normalizeFormationTemplate("3-5-2"), "3-5-2");
  assert.equal(normalizeFormationTemplate("5-3-2"), "5-3-2");
  assert.equal(normalizeFormationTemplate("3-4-3"), "4-3-3");
});

test("todos los 4-2-3-1 comparten las mismas coordenadas de plantilla", () => {
  const template = getFormationTemplateCoordinates("4-2-3-1");
  const spain = layoutPredictedStarters(SPAIN_4231, "4-2-3-1").map((slot) => ({ x: slot.x, y: slot.y }));
  const alt = layoutPredictedStarters(
    SPAIN_4231.map((row, index) => ({
      ...row,
      slotKey: index % 2 === 0 ? row.slotKey : row.slotKey,
    })),
    "4-2-3-1"
  ).map((slot) => ({ x: slot.x, y: slot.y }));

  assert.deepEqual(spain, template);
  assert.deepEqual(alt, template);
});

test("todos los 4-3-3 comparten plantilla independiente del equipo", () => {
  const template = getFormationTemplateCoordinates("4-3-3");
  const mexico = layoutPredictedStarters(MEXICO_433, "4-3-3").map((slot) => ({ x: slot.x, y: slot.y }));
  assert.deepEqual(mexico, template);
});

test("4-3-3 y 4-4-2 tienen geometrias distintas", () => {
  const f433 = getFormationTemplateCoordinates("4-3-3");
  const f442 = getFormationTemplateCoordinates("4-4-2");
  assert.notDeepEqual(f433, f442);
});

test("plantilla ancla portero en porteria y defensa en borde del area", () => {
  const positioned = layoutPredictedStarters(SPAIN_4231, "4-2-3-1");
  const gk = positioned.find((slot) => slot.slotKey === "GK");
  const defenders = positioned.filter((slot) => slot.role === "DF");

  assert.ok(gk);
  assert.ok(gk.y >= 90, `portero demasiado adelantado (y=${gk.y})`);
  for (const defender of defenders) {
    assert.ok(defender.y >= 77 && defender.y <= 81, `defensa fuera de línea (y=${defender.y})`);
  }
});

test("assignFormationTemplateCoordinates coloca porteria abajo y delantero arriba", () => {
  const positioned = assignFormationTemplateCoordinates(
    [
      { slotKey: "GK", role: "GK" },
      { slotKey: "ST", role: "FW" },
    ],
    "4-2-3-1"
  );

  const gk = positioned.find((slot) => slot.slotKey === "GK");
  const st = positioned.find((slot) => slot.slotKey === "ST");
  assert.ok(gk && st);
  assert.ok(gk.y > st.y);
});

test("4-4-2 mantiene cuatro medios en la misma línea", () => {
  const positioned = layoutPredictedStarters(
    [
      { slotKey: "GK", role: "GK" },
      { slotKey: "LB", role: "DF" },
      { slotKey: "CB", role: "DF" },
      { slotKey: "CB", role: "DF" },
      { slotKey: "RB", role: "DF" },
      { slotKey: "LM", role: "MF" },
      { slotKey: "CM", role: "MF" },
      { slotKey: "CM", role: "MF" },
      { slotKey: "RM", role: "MF" },
      { slotKey: "ST", role: "FW" },
      { slotKey: "ST", role: "FW" },
    ],
    "4-4-2"
  );

  const mids = positioned.filter((slot) => ["LM", "LCM", "RCM", "RM"].includes(slot.slotKey));
  assert.equal(mids.length, 4);
  assert.ok(mids.every((slot) => slot.y === mids[0]!.y));
  assert.ok(mids.every((slot) => slot.y > positioned.find((s) => s.slotKey === "LST")!.y));
});

test("4-3-3 acepta pivotes DM en la linea de tres medios", () => {
  const template = getFormationTemplateCoordinates("4-3-3");
  const withDm = layoutPredictedStarters(
    [
      { slotKey: "GK", role: "GK" },
      { slotKey: "LB", role: "DF" },
      { slotKey: "CB", role: "DF" },
      { slotKey: "CB", role: "DF" },
      { slotKey: "RB", role: "DF" },
      { slotKey: "DM", role: "MF" },
      { slotKey: "CM", role: "MF" },
      { slotKey: "DM", role: "MF" },
      { slotKey: "LW", role: "MF" },
      { slotKey: "ST", role: "FW" },
      { slotKey: "RW", role: "MF" },
    ],
    "4-3-3"
  ).map((slot) => ({ x: slot.x, y: slot.y }));

  assert.deepEqual(withDm, template);
});
