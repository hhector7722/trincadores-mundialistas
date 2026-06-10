import assert from "node:assert/strict";
import test from "node:test";
import { buildProbableXI } from "./build-probable-xi";
import { normalizePositionRole } from "./position-map";

test("normalizePositionRole mapea códigos Fjelstul", () => {
  assert.equal(normalizePositionRole("goal keeper"), "GK");
  assert.equal(normalizePositionRole("GK"), "GK");
  assert.equal(normalizePositionRole("defender"), "DF");
  assert.equal(normalizePositionRole("DF"), "DF");
  assert.equal(normalizePositionRole("midfielder"), "MF");
  assert.equal(normalizePositionRole("MF"), "MF");
  assert.equal(normalizePositionRole("forward"), "FW");
});

test("buildProbableXI genera 11 slots en 4-3-3", () => {
  const players = [
    ...Array.from({ length: 2 }, (_, i) => ({
      player_name: `Portero ${i + 1}`,
      position: "GK",
      shirt_number: i + 1,
    })),
    ...Array.from({ length: 6 }, (_, i) => ({
      player_name: `Defensa ${i + 1}`,
      position: "DF",
      shirt_number: i + 3,
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      player_name: `Medio ${i + 1}`,
      position: "MF",
      shirt_number: i + 10,
    })),
    ...Array.from({ length: 4 }, (_, i) => ({
      player_name: `Delantero ${i + 1}`,
      position: "FW",
      shirt_number: i + 20,
    })),
  ];

  const result = buildProbableXI(players, "4-3-3");
  assert.equal(result.slots.length, 11);
  assert.equal(result.formation, "4-3-3");
  assert.equal(result.slots.filter((s) => s.role === "GK").length, 1);
  assert.equal(result.slots.filter((s) => s.role === "DF").length, 4);
  assert.equal(result.slots.filter((s) => s.isPlaceholder).length, 0);
});

test("buildProbableXI usa placeholders si faltan jugadores", () => {
  const players = [
    { player_name: "Portero", position: "GK", shirt_number: 1 },
    { player_name: "Defensa 1", position: "DF", shirt_number: 2 },
  ];
  const result = buildProbableXI(players, "4-4-2");
  assert.equal(result.slots.length, 11);
  assert.ok(result.slots.some((s) => s.isPlaceholder));
});

test("buildProbableXI respeta conteos tácticos en 3-5-2 y 5-3-2", () => {
  const squad = [
    { player_name: "POR", position: "GK", shirt_number: 1 },
    ...Array.from({ length: 8 }, (_, i) => ({
      player_name: `DEF ${i}`,
      position: "DF",
      shirt_number: i + 2,
    })),
    ...Array.from({ length: 8 }, (_, i) => ({
      player_name: `MED ${i}`,
      position: "MF",
      shirt_number: i + 20,
    })),
    ...Array.from({ length: 4 }, (_, i) => ({
      player_name: `DEL ${i}`,
      position: "FW",
      shirt_number: i + 30,
    })),
  ];

  const f352 = buildProbableXI(squad, "3-5-2");
  assert.equal(f352.formation, "3-5-2");
  assert.equal(f352.slots.filter((slot) => slot.role === "DF").length, 3);
  assert.equal(f352.slots.filter((slot) => slot.role === "MF").length, 5);
  assert.equal(f352.slots.filter((slot) => slot.role === "FW").length, 2);

  const f532 = buildProbableXI(squad, "5-3-2");
  assert.equal(f532.formation, "5-3-2");
  assert.equal(f532.slots.filter((slot) => slot.role === "DF").length, 5);
  assert.equal(f532.slots.filter((slot) => slot.role === "MF").length, 3);
  assert.equal(f532.slots.filter((slot) => slot.role === "FW").length, 2);
});
