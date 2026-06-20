import assert from "node:assert/strict";
import test from "node:test";
import {
  findMvpOptionByKey,
  findMvpOptionBySaved,
  mvpPlayersMatch,
  mvpSelectionKey,
  resolveMvpSelection,
} from "./mvp-selection-key";

test("mvpSelectionKey distingue jugadores con el mismo dorsal", () => {
  const vega = mvpSelectionKey("Mexico", { name: "Erick Vega", shirtNumber: 10 });
  const alvarez = mvpSelectionKey("Mexico", { name: "Julian Alvarez", shirtNumber: 10 });
  assert.notEqual(vega, alvarez);
  assert.equal(vega, "Mexico::10::erick vega");
  assert.equal(alvarez, "Mexico::10::julian alvarez");
});

test("mvpSelectionKey sin dorsal usa nombre normalizado", () => {
  const key = mvpSelectionKey("Spain", { name: "Rodri Hernández", shirtNumber: null });
  assert.equal(key, "Spain::n::rodri hernandez");
});

test("mvpPlayersMatch solo marca un jugador con dorsal duplicado", () => {
  const vega = { name: "Erick Vega", teamName: "Mexico", shirtNumber: 10 };
  const alvarez = { name: "Julian Alvarez", teamName: "Mexico", shirtNumber: 10 };

  assert.equal(mvpPlayersMatch("Mexico", { name: "Vega", shirtNumber: 10 }, vega), true);
  assert.equal(mvpPlayersMatch("Mexico", { name: "Álvarez", shirtNumber: 10 }, vega), false);
  assert.equal(mvpPlayersMatch("Mexico", { name: "Álvarez", shirtNumber: 10 }, alvarez), true);
});

test("findMvpOptionByKey no confunde jugadores con el mismo dorsal", () => {
  const options = [
    {
      key: "Mexico::10::julian alvarez",
      name: "Julian Alvarez",
      teamName: "Mexico",
      shirtNumber: 10,
    },
    {
      key: "Mexico::10::erick vega",
      name: "Erick Vega",
      teamName: "Mexico",
      shirtNumber: 10,
    },
  ];

  assert.equal(findMvpOptionByKey(options, "Mexico::10::vega")?.name, "Erick Vega");
  assert.equal(findMvpOptionByKey(options, "Mexico::10::alvarez")?.name, "Julian Alvarez");
});

test("resolveMvpSelection usa jugador tactico si la plantilla no coincide", () => {
  const options = [
    {
      key: "Mexico::10::erick vega",
      name: "Erick Vega",
      teamName: "Mexico",
      shirtNumber: 10,
    },
  ];
  const lineupPlayers = [
    { name: "Alexis Vega", teamName: "Mexico", shirtNumber: 10 },
  ];

  const resolved = resolveMvpSelection(
    options,
    "Mexico::10::alexis vega",
    lineupPlayers
  );

  assert.equal(resolved?.name, "Alexis Vega");
  assert.equal(resolved?.teamName, "Mexico");
});

test("findMvpOptionByKey resuelve nombre abreviado del campo", () => {
  const options = [
    {
      key: "Mexico::10::julian alvarez",
      name: "Julian Alvarez",
      teamName: "Mexico",
      shirtNumber: 10,
    },
    {
      key: "Mexico::10::erick vega",
      name: "Erick Vega",
      teamName: "Mexico",
      shirtNumber: 10,
    },
  ];

  const fromField = findMvpOptionByKey(options, "Mexico::10::alvarez");
  assert.equal(fromField?.name, "Julian Alvarez");
});

test("findMvpOptionBySaved tolera alias de nombre", () => {
  const options = [
    {
      key: "Spain::10::pedri",
      name: "Pedri",
      teamName: "Spain",
      shirtNumber: 10,
    },
  ];

  const match = findMvpOptionBySaved(options, "Pedri González", "Spain");
  assert.equal(match?.key, "Spain::10::pedri");
});

test("findMvpOptionBySaved prioriza dorsal sobre nombre ambiguo", () => {
  const options = [
    {
      key: "Mexico::1::raul rangel",
      name: "Raul Rangel",
      teamName: "Mexico",
      shirtNumber: 1,
    },
    {
      key: "Mexico::9::raul jimenez",
      name: "Raúl Jiménez",
      teamName: "Mexico",
      shirtNumber: 9,
    },
  ];

  assert.equal(
    findMvpOptionBySaved(options, "Raúl Jiménez", "Mexico", 9)?.name,
    "Raúl Jiménez"
  );
  assert.equal(
    findMvpOptionBySaved(options, "Raúl", "Mexico", 9)?.name,
    "Raúl Jiménez"
  );
  assert.equal(
    findMvpOptionBySaved(options, "Raul Rangel", "Mexico", 1)?.name,
    "Raul Rangel"
  );
});
test("findMvpOptionBySaved no confunde Vinicius Jr con Neymar Jr", () => {
  const options = [
    {
      key: "Brazil::10::neymar jr",
      name: "Neymar Jr",
      teamName: "Brazil",
      shirtNumber: 10,
    },
    {
      key: "Brazil::7::vinicius junior",
      name: "Vinicius Junior",
      teamName: "Brazil",
      shirtNumber: 7,
    },
  ];

  assert.equal(findMvpOptionBySaved(options, "Vinicius Jr", "Brazil")?.name, "Vinicius Junior");
  assert.equal(findMvpOptionBySaved(options, "Neymar Jr", "Brazil")?.name, "Neymar Jr");
});

test("findMvpOptionBySaved no confunde jugadores con el mismo nombre de pila sin dorsal", () => {
  const options = [
    {
      key: "Mexico::1::raul rangel",
      name: "Raul Rangel",
      teamName: "Mexico",
      shirtNumber: 1,
    },
    {
      key: "Mexico::9::raul jimenez",
      name: "Raúl Jiménez",
      teamName: "Mexico",
      shirtNumber: 9,
    },
  ];

  assert.equal(findMvpOptionBySaved(options, "Raúl Jiménez", "Mexico")?.name, "Raúl Jiménez");
  assert.equal(findMvpOptionBySaved(options, "Jiménez", "Mexico")?.name, "Raúl Jiménez");
  assert.equal(findMvpOptionBySaved(options, "Raul Rangel", "Mexico")?.name, "Raul Rangel");
});
