import assert from "node:assert/strict";
import test from "node:test";
import { findSquadPlayer, reserveSquadPlayerIdentity } from "./bsd-squad-match";

const mexicoSquad = [
  { player_name: "Alexis Vega", shirt_number: 10, position: "FW" },
  { player_name: "Gilberto Mora", shirt_number: 19, position: "MF" },
  { player_name: "Roberto Alvarado", shirt_number: 25, position: "FW" },
  { player_name: "Johan Vasquez", shirt_number: 5, position: "DF" },
];

test("findSquadPlayer no reutiliza dorsal si el nombre BSD no coincide", () => {
  const everardo = findSquadPlayer("Everardo López", 25, mexicoSquad);
  assert.equal(everardo, null);
});

test("findSquadPlayer excluye jugadores ya asignados", () => {
  const used = new Set<string>();
  const first = findSquadPlayer("Roberto Alvarado", 25, mexicoSquad, {
    excludeIdentities: used,
  });
  reserveSquadPlayerIdentity(first, used);

  const second = findSquadPlayer("Everardo López", 25, mexicoSquad, {
    excludeIdentities: used,
  });

  assert.equal(first?.player_name, "Roberto Alvarado");
  assert.equal(second, null);
});

test("findSquadPlayer resuelve apellido único", () => {
  const vega = findSquadPlayer("Alexis Vega", 9, mexicoSquad);
  assert.equal(vega?.player_name, "Alexis Vega");
});

test("findSquadPlayer no confunde Bryan González con Armando Gonzalez", () => {
  const match = findSquadPlayer("Bryan González", 5, mexicoSquad);
  assert.equal(match, null);
});
