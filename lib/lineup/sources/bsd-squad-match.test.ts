import assert from "node:assert/strict";
import test from "node:test";
import type { OfficialSquadPlayer } from "@/lib/lineup/lineup-queries";
import { findSquadPlayer, reserveSquadPlayerIdentity } from "./bsd-squad-match";

const mexicoSquad = [
  { player_name: "Raul Rangel", shirt_number: 1, position: "GK" },
  { player_name: "Johan Vasquez", shirt_number: 5, position: "DF" },
  { player_name: "Edson Alvarez", shirt_number: 4, position: "DF" },
  { player_name: "Alexis Vega", shirt_number: 10, position: "FW" },
  { player_name: "Armando Gonzalez", shirt_number: 14, position: "MF" },
  { player_name: "Gilberto Mora", shirt_number: 19, position: "MF" },
  { player_name: "Roberto Alvarado", shirt_number: 25, position: "FW" },
];

const mexicoOfficial: OfficialSquadPlayer[] = mexicoSquad.map((player) => ({
  playerName: player.player_name,
  shirtNumber: player.shirt_number!,
  position: player.position ?? "",
}));

test("findSquadPlayer legacy no reutiliza dorsal si el nombre BSD no coincide", () => {
  const everardo = findSquadPlayer(
    { name: "Everardo López", shirtNumber: 25 },
    mexicoSquad,
    [],
    new Set<number>()
  );
  assert.equal(everardo, null);
});

test("findSquadPlayer con dorsal ya usado devuelve null", () => {
  const usedShirts = new Set<number>([10]);
  const match = findSquadPlayer(
    { name: "Efrain Alvarez", shirtNumber: 10 },
    mexicoSquad,
    mexicoOfficial,
    usedShirts
  );
  assert.equal(match, null);
});

test("findSquadPlayer resuelve por dorsal oficial cuando el nombre BSD no existe", () => {
  const usedShirts = new Set<number>();
  const match = findSquadPlayer(
    { name: "Bryan González", shirtNumber: 5 },
    mexicoSquad,
    mexicoOfficial,
    usedShirts
  );
  assert.equal(match?.player_name, "Johan Vasquez");
  assert.equal(match?.shirt_number, 5);
});

test("findSquadPlayer asigna Roberto Alvarado por dorsal 25 antes del homónimo BSD", () => {
  const usedShirts = new Set<number>();
  const identities = new Set<string>();

  const everardo = findSquadPlayer(
    { name: "Everardo López", shirtNumber: 25 },
    mexicoSquad,
    mexicoOfficial,
    usedShirts,
    { excludeIdentities: identities }
  );
  assert.equal(everardo?.player_name, "Roberto Alvarado");
  usedShirts.add(everardo!.shirt_number!);
  reserveSquadPlayerIdentity(everardo, identities);

  const roberto = findSquadPlayer(
    { name: "Roberto Alvarado", shirtNumber: 25 },
    mexicoSquad,
    mexicoOfficial,
    usedShirts,
    { excludeIdentities: identities }
  );
  assert.equal(roberto, null);
});

test("findSquadPlayer resuelve apellido único con dorsal oficial", () => {
  const match = findSquadPlayer(
    { name: "Alexis Vega", shirtNumber: 9 },
    mexicoSquad,
    mexicoOfficial,
    new Set<number>()
  );
  assert.equal(match?.player_name, "Alexis Vega");
  assert.equal(match?.shirt_number, 10);
});
