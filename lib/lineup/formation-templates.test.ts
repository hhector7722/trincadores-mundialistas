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
  assert.equal(normalizeFormationTemplate("3-5-2"), "4-3-3");
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
