import assert from "node:assert/strict";
import { test } from "node:test";
import { parseFotmobConfirmedTeamLineup } from "@/lib/lineup/sources/fotmob-lineup-parse";

const MEXICO_STARTERS = [
  { name: "Raúl Rangel", shirtNumber: "1", usualPlayingPositionId: 0 },
  { name: "Israel Reyes", shirtNumber: "15", usualPlayingPositionId: 1 },
  { name: "César Montes", shirtNumber: "3", usualPlayingPositionId: 1 },
  { name: "Johan Vásquez", shirtNumber: "5", usualPlayingPositionId: 1 },
  { name: "Jesús Gallardo", shirtNumber: "23", usualPlayingPositionId: 1 },
  { name: "Érik Lira", shirtNumber: "6", usualPlayingPositionId: 1 },
  { name: "Roberto Alvarado", shirtNumber: "25", usualPlayingPositionId: 2 },
  { name: "Brian Gutiérrez", shirtNumber: "26", usualPlayingPositionId: 2 },
  { name: "Álvaro Fidalgo", shirtNumber: "8", usualPlayingPositionId: 2 },
  { name: "Julián Quiñones", shirtNumber: "16", usualPlayingPositionId: 3 },
  { name: "Raul Jiménez", shirtNumber: "9", usualPlayingPositionId: 3 },
];

const SQUAD = [
  { player_name: "Raúl Rangel", shirt_number: 1, position: "G" },
  { player_name: "Julián Quiñones", shirt_number: 16, position: "F" },
  { player_name: "Raul Jiménez", shirt_number: 9, position: "F" },
  { player_name: "Érik Lira", shirt_number: 6, position: "M" },
];

test("parseFotmobConfirmedTeamLineup genera confirmed con 11 titulares", () => {
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
