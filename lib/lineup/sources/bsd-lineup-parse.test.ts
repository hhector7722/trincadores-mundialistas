import assert from "node:assert/strict";
import test from "node:test";
import type { OfficialSquadPlayer } from "@/lib/lineup/lineup-queries";
import {
  parseBsdPredictedTeamLineupWithOfficialSquad,
} from "./bsd-lineup-parse";

const squad = Array.from({ length: 11 }, (_, i) => ({
  player_name: `Jugador ${i + 1}`,
  position: i === 0 ? "GK" : i < 5 ? "DF" : i < 8 ? "MF" : "FW",
  shirt_number: i + 1,
}));

function toOfficial(players: typeof squad): OfficialSquadPlayer[] {
  return players.map((player) => ({
    playerName: player.player_name,
    shirtNumber: player.shirt_number,
    position: player.position,
  }));
}

test("parseBsdPredictedTeamLineup genera predicted con 11 titulares", () => {
  const payload = {
    team: "Mexico",
    predicted_formation: "4-3-3",
    confidence: 40,
    starters: Array.from({ length: 11 }, (_, i) => ({
      name: `Jugador ${i + 1}`,
      jersey_number: i + 1,
      position: i === 0 ? "G" : "M",
      predicted_slot: i === 0 ? "GK" : "CM",
      availability: "available",
    })),
    substitutes: [{ name: "Suplente 1", jersey_number: 99, position: "M" }],
    updated_at: "2026-06-08T20:31:18.804286+00:00",
  };

  const lineup = parseBsdPredictedTeamLineupWithOfficialSquad(
    payload,
    squad,
    "2026-06-08T20:31:18.804286+00:00",
    toOfficial(squad)
  );
  assert.ok(lineup);
  assert.equal(lineup.sourceKind, "predicted");
  assert.equal(lineup.dataSourceCode, "bsd");
  assert.equal(lineup.slots.length, 11);
  assert.equal(lineup.bench?.length, 1);
});

test("parseBsdPredictedTeamLineup corrige Laporte/Porro mal ubicados por BSD", () => {
  const squad = [
    { player_name: "Unai Simon", position: "GK", shirt_number: 23 },
    { player_name: "Marc Cucurella", position: "DF", shirt_number: 24 },
    { player_name: "Aymeric Laporte", position: "DF", shirt_number: 14 },
    { player_name: "Pau Cubarsi", position: "DF", shirt_number: 22 },
    { player_name: "Pedro Porro", position: "DF", shirt_number: 12 },
    { player_name: "Rodri", position: "MF", shirt_number: 16 },
    { player_name: "Martin Zubimendi", position: "MF", shirt_number: 18 },
    { player_name: "Nico Williams", position: "FW", shirt_number: 17 },
    { player_name: "Dani Olmo", position: "FW", shirt_number: 10 },
    { player_name: "Yeremy Pino", position: "FW", shirt_number: 11 },
    { player_name: "Borja Iglesias", position: "FW", shirt_number: 26 },
  ];

  const payload = {
    team: "Spain",
    predicted_formation: "4-2-3-1",
    starters: [
      { name: "Unai Simon", jersey_number: 23, predicted_slot: "GK", position: "G" },
      { name: "Marc Cucurella", jersey_number: 24, predicted_slot: "LB", position: "D" },
      { name: "Aymeric Laporte", jersey_number: 14, predicted_slot: "RB", position: "D" },
      { name: "Pau Cubarsi", jersey_number: 22, predicted_slot: "CB", position: "D" },
      { name: "Pedro Porro", jersey_number: 12, predicted_slot: "CB", position: "D" },
      { name: "Rodri", jersey_number: 16, predicted_slot: "DM", position: "M" },
      { name: "Martin Zubimendi", jersey_number: 18, predicted_slot: "DM", position: "M" },
      { name: "Nico Williams", jersey_number: 17, predicted_slot: "LW", position: "F" },
      { name: "Dani Olmo", jersey_number: 10, predicted_slot: "AM", position: "M" },
      { name: "Yeremy Pino", jersey_number: 11, predicted_slot: "RW", position: "F" },
      { name: "Borja Iglesias", jersey_number: 26, predicted_slot: "ST", position: "F" },
    ],
    substitutes: [],
    updated_at: "2026-06-09T20:00:00+00:00",
  };

  const lineup = parseBsdPredictedTeamLineupWithOfficialSquad(
    payload,
    squad,
    payload.updated_at,
    toOfficial(squad)
  );
  assert.ok(lineup);

  const laporte = lineup.slots.find((slot) => slot.name === "Aymeric Laporte");
  const porro = lineup.slots.find((slot) => slot.name === "Pedro Porro");

  assert.ok(laporte && porro);
  assert.equal(laporte.positionLabel, "DFC");
  assert.equal(porro.positionLabel, "LD");
  assert.ok(laporte.x < porro.x, "Laporte debe quedar más centrado que Porro a la derecha");
});

test("parseBsdPredictedTeamLineup coloca Iglesias de 9 y Pino en banda", () => {
  const squad = [
    { player_name: "Unai Simon", position: "GK", shirt_number: 23 },
    { player_name: "Marc Cucurella", position: "DF", shirt_number: 24 },
    { player_name: "Aymeric Laporte", position: "DF", shirt_number: 14 },
    { player_name: "Pau Cubarsi", position: "DF", shirt_number: 22 },
    { player_name: "Pedro Porro", position: "DF", shirt_number: 12 },
    { player_name: "Pedri", position: "MF", shirt_number: 20 },
    { player_name: "Mikel Merino", position: "MF", shirt_number: 6 },
    { player_name: "Mikel Oyarzabal", position: "FW", shirt_number: 21 },
    { player_name: "Alex Baena", position: "MF", shirt_number: 15 },
    { player_name: "Yeremy Pino", position: "FW", shirt_number: 11 },
    { player_name: "Borja Iglesias", position: "FW", shirt_number: 26 },
  ];

  const payload = {
    team: "Spain",
    predicted_formation: "4-2-3-1",
    starters: [
      { name: "Unai Simon", jersey_number: 23, predicted_slot: "GK", position: "G" },
      { name: "Marc Cucurella", jersey_number: 24, predicted_slot: "LB", position: "D" },
      { name: "Aymeric Laporte", jersey_number: 14, predicted_slot: "CB", position: "D" },
      { name: "Pau Cubarsi", jersey_number: 22, predicted_slot: "CB", position: "D" },
      { name: "Pedro Porro", jersey_number: 12, predicted_slot: "RB", position: "D" },
      { name: "Pedri", jersey_number: 20, predicted_slot: "DM", position: "M" },
      { name: "Mikel Merino", jersey_number: 6, predicted_slot: "DM", position: "M" },
      { name: "Mikel Oyarzabal", jersey_number: 21, predicted_slot: "LW", position: "F" },
      { name: "Alex Baena", jersey_number: 15, predicted_slot: "AM", position: "M" },
      { name: "Yeremy Pino", jersey_number: 11, predicted_slot: "RW", position: "F" },
      { name: "Borja Iglesias", jersey_number: 26, predicted_slot: "ST", position: "F" },
    ],
    substitutes: [],
    updated_at: "2026-06-09T20:00:00+00:00",
  };

  const lineup = parseBsdPredictedTeamLineupWithOfficialSquad(
    payload,
    squad,
    payload.updated_at,
    toOfficial(squad)
  );
  assert.ok(lineup);

  const iglesias = lineup.slots.find((slot) => slot.name === "Borja Iglesias");
  const pino = lineup.slots.find((slot) => slot.name === "Yeremy Pino");

  assert.ok(iglesias && pino);
  assert.equal(iglesias.positionLabel, "DC");
  assert.equal(pino.positionLabel, "ED");
  assert.equal(iglesias.x, 50);
  assert.ok(iglesias.y < pino.y, "El 9 debe quedar más arriba que el extremo");
});

test("parseBsdPredictedTeamLineup Mexico no duplica dorsales oficiales", () => {
  const squad = [
    { player_name: "Raul Rangel", position: "GK", shirt_number: 1 },
    { player_name: "Johan Vasquez", position: "DF", shirt_number: 5 },
    { player_name: "Edson Alvarez", position: "DF", shirt_number: 4 },
    { player_name: "Alexis Vega", position: "FW", shirt_number: 10 },
    { player_name: "Armando Gonzalez", position: "MF", shirt_number: 14 },
    { player_name: "Gilberto Mora", position: "MF", shirt_number: 19 },
    { player_name: "Roberto Alvarado", position: "FW", shirt_number: 25 },
  ];

  const payload = {
    team: "Mexico",
    predicted_formation: "4-3-3",
    starters: [
      { name: "Raul Rangel", jersey_number: 1, predicted_slot: "GK", position: "G" },
      { name: "Bryan González", jersey_number: 5, predicted_slot: "CB", position: "D" },
      { name: "Everardo López", jersey_number: 25, predicted_slot: "RB", position: "D" },
      { name: "Victor Guzmán", jersey_number: 4, predicted_slot: "CB", position: "D" },
      { name: "Richard Ledezma", jersey_number: 37, predicted_slot: "LB", position: "D" },
      { name: "Alexis Vega", jersey_number: 10, predicted_slot: "LW", position: "F" },
      { name: "Marcel Ruíz", jersey_number: 14, predicted_slot: "CM", position: "M" },
      { name: "Carlos Rodríguez", jersey_number: 19, predicted_slot: "CM", position: "M" },
      { name: "Roberto Alvarado", jersey_number: 25, predicted_slot: "RW", position: "F" },
      { name: "Germán Berterame", jersey_number: 19, predicted_slot: "ST", position: "F" },
      { name: "Efrain Alvarez", jersey_number: 10, predicted_slot: "AM", position: "M" },
    ],
    substitutes: [],
    updated_at: "2026-06-10T12:00:00+00:00",
  };

  const lineup = parseBsdPredictedTeamLineupWithOfficialSquad(
    payload,
    squad,
    payload.updated_at,
    toOfficial(squad)
  );
  assert.ok(lineup);

  const shirts = lineup.slots
    .map((slot) => slot.shirtNumber)
    .filter((shirt): shirt is number => shirt != null);
  assert.equal(new Set(shirts).size, shirts.length, "No debe haber dorsales duplicados");

  const vega = lineup.slots.find((slot) => slot.shirtNumber === 10);
  assert.ok(vega);
  assert.equal(vega.name, "Alexis Vega");
  assert.equal(vega.isPlaceholder, false);

  const bryan = lineup.slots.find((slot) => slot.name.includes("Gonz"));
  assert.ok(bryan);
  assert.equal(bryan.isPlaceholder, false);
  assert.equal(bryan.shirtNumber, 5);
  assert.equal(bryan.name, "Bryan González");

  const ledezma = lineup.slots.find((slot) => slot.name.includes("Ledezma"));
  assert.ok(ledezma);
  assert.equal(ledezma.shirtNumber, 37);

  const roberto = lineup.slots.find((slot) => slot.name === "Roberto Alvarado");
  assert.ok(roberto);
  assert.equal(roberto.shirtNumber, 25);

  assert.ok(lineup.slots.every((slot) => slot.shirtNumber != null && slot.shirtNumber > 0));
  assert.ok(!lineup.slots.some((slot) => slot.name === "Por confirmar"));
});
