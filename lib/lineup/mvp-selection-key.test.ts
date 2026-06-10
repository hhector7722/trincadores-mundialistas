import assert from "node:assert/strict";
import test from "node:test";
import {
  findMvpOptionByKey,
  findMvpOptionBySaved,
  mvpPlayersMatch,
  mvpSelectionKey,
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
