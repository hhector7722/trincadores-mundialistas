import assert from "node:assert/strict";

import test from "node:test";

import type { OfficialSquadPlayer } from "@/lib/lineup/lineup-queries";

import {

  assignStarterShirtNumbers,

  findOfficialSquadMatch,

  findSquadPlayer,

  namesReferToSamePlayer,

  reserveSquadPlayerIdentity,

} from "./bsd-squad-match";



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



test("namesReferToSamePlayer tolera acentos y orden", () => {

  assert.equal(namesReferToSamePlayer("Alexis Vega", "Alexis Vega"), true);

  assert.equal(namesReferToSamePlayer("Bryan González", "Johan Vasquez"), false);

});



test("findOfficialSquadMatch no sustituye jugador solo por dorsal oficial", () => {

  const match = findOfficialSquadMatch(

    { name: "Bryan González", shirtNumber: 5 },

    mexicoSquad,

    mexicoOfficial

  );

  assert.equal(match, null);

});



test("findOfficialSquadMatch confirma identidad por dorsal solo si el nombre encaja", () => {

  const match = findOfficialSquadMatch(

    { name: "Armando Gonzalez", shirtNumber: 14 },

    mexicoSquad,

    mexicoOfficial

  );

  assert.equal(match?.player_name, "Armando Gonzalez");

  assert.equal(match?.shirt_number, 14);

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



test("assignStarterShirtNumbers prioriza dorsal oficial antes que BSD del slot", () => {

  const shirts = assignStarterShirtNumbers(

    [

      { official: null, bsdJersey: 25 },

      { official: mexicoSquad[6]!, bsdJersey: 25 },

    ],

    true

  );

  assert.deepEqual(shirts, [1, 25]);

});



test("assignStarterShirtNumbers nunca deja camisetas vacías", () => {

  const shirts = assignStarterShirtNumbers(

    [

      { official: null, bsdJersey: 37 },

      { official: null, bsdJersey: 0 },

    ],

    true

  );

  assert.equal(shirts.length, 2);

  assert.ok(shirts.every((shirt) => shirt != null && shirt > 0));

  assert.equal(shirts[0], 37);

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



test("findOfficialSquadMatch no reutiliza jugador ya asignado", () => {

  const identities = new Set<string>();

  const roberto = findOfficialSquadMatch(

    { name: "Roberto Alvarado", shirtNumber: 25 },

    mexicoSquad,

    mexicoOfficial,

    { excludeIdentities: identities }

  );

  assert.ok(roberto);

  reserveSquadPlayerIdentity(roberto, identities);



  const duplicate = findOfficialSquadMatch(

    { name: "Roberto Alvarado", shirtNumber: 25 },

    mexicoSquad,

    mexicoOfficial,

    { excludeIdentities: identities }

  );

  assert.equal(duplicate, null);

});


