import assert from "node:assert/strict";
import { test } from "node:test";
import { fotmobPlayerToFieldCoord } from "@/lib/lineup/sources/fotmob-layout-coords";
import { slotKeyFromFotmobPositionId } from "@/lib/lineup/sources/fotmob-position-id";
import { parseFotmobConfirmedTeamLineup } from "@/lib/lineup/sources/fotmob-lineup-parse";

const MEXICO_STARTERS = [
  {
    name: "Raúl Rangel",
    shirtNumber: "1",
    positionId: 11,
    verticalLayout: { x: 0.5, y: 0.1 },
  },
  {
    name: "Israel Reyes",
    shirtNumber: "15",
    positionId: 38,
    verticalLayout: { x: 0.875, y: 0.292 },
  },
  {
    name: "César Montes",
    shirtNumber: "3",
    positionId: 36,
    verticalLayout: { x: 0.625, y: 0.292 },
  },
  {
    name: "Johan Vásquez",
    shirtNumber: "5",
    positionId: 34,
    verticalLayout: { x: 0.375, y: 0.292 },
  },
  {
    name: "Jesús Gallardo",
    shirtNumber: "23",
    positionId: 32,
    verticalLayout: { x: 0.125, y: 0.292 },
  },
  {
    name: "Érik Lira",
    shirtNumber: "6",
    positionId: 66,
    verticalLayout: { x: 0.3, y: 0.485 },
  },
  {
    name: "Roberto Alvarado",
    shirtNumber: "25",
    positionId: 72,
    verticalLayout: { x: 0.125, y: 0.613 },
  },
  {
    name: "Brian Gutiérrez",
    shirtNumber: "26",
    positionId: 74,
    verticalLayout: { x: 0.375, y: 0.613 },
  },
  {
    name: "Álvaro Fidalgo",
    shirtNumber: "8",
    positionId: 76,
    verticalLayout: { x: 0.625, y: 0.613 },
  },
  {
    name: "Julián Quiñones",
    shirtNumber: "16",
    positionId: 78,
    verticalLayout: { x: 0.875, y: 0.613 },
  },
  {
    name: "Raul Jiménez",
    shirtNumber: "9",
    positionId: 115,
    verticalLayout: { x: 0.5, y: 0.87 },
  },
];

const SQUAD = [
  { player_name: "Raúl Rangel", shirt_number: 1, position: "G" },
  { player_name: "Julián Quiñones", shirt_number: 16, position: "F" },
  { player_name: "Raul Jiménez", shirt_number: 9, position: "F" },
  { player_name: "Érik Lira", shirt_number: 6, position: "M" },
];

test("fotmobPlayerToFieldCoord invierte profundidad al sistema táctico", () => {
  const gk = fotmobPlayerToFieldCoord({
    verticalLayout: { x: 0.5, y: 0.1 },
  });
  const st = fotmobPlayerToFieldCoord({
    verticalLayout: { x: 0.5, y: 0.87 },
  });

  assert.ok(gk && st);
  assert.ok(gk.y > st.y);
});

test("slotKeyFromFotmobPositionId mapea posiciones conocidas", () => {
  assert.equal(slotKeyFromFotmobPositionId(11), "GK");
  assert.equal(slotKeyFromFotmobPositionId(115), "ST");
  assert.equal(slotKeyFromFotmobPositionId(85), "AM");
});

test("parseFotmobConfirmedTeamLineup genera confirmed con 11 titulares y coords de fuente", () => {
  const lineup = parseFotmobConfirmedTeamLineup(
    {
      name: "Mexico",
      formation: "4-1-4-1",
      starters: MEXICO_STARTERS,
      subs: [{ name: "Guillermo Ochoa", shirtNumber: "13" }],
    },
    SQUAD,
    "2026-06-11T20:00:00.000Z"
  );

  assert.ok(lineup);
  assert.equal(lineup.sourceKind, "confirmed");
  assert.equal(lineup.dataSourceCode, "fotmob");
  assert.equal(lineup.formationLabel, "4-1-4-1");
  assert.equal(lineup.slots.length, 11);
  assert.equal(lineup.bench?.length, 1);
  assert.equal(lineup.isProbable, false);

  const quinones = lineup.slots.find((slot) => slot.name === "Julián Quiñones");
  assert.ok(quinones);
  assert.equal(quinones.shirtNumber, 16);
  assert.equal(quinones.slotKey, "RM");
  assert.ok(quinones.y < 50);

  const jimenez = lineup.slots.find((slot) => slot.name === "Raul Jiménez");
  assert.ok(jimenez);
  assert.equal(jimenez.slotKey, "ST");
});

test("parseFotmobConfirmedTeamLineup rechaza menos de 11 titulares", () => {
  const lineup = parseFotmobConfirmedTeamLineup(
    {
      formation: "4-3-3",
      starters: MEXICO_STARTERS.slice(0, 10),
    },
    SQUAD,
    "2026-06-11T20:00:00.000Z"
  );

  assert.equal(lineup, null);
});
