import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { goalkeeperFilter, searchPlayers, type SearchablePlayer } from "./search-players";

const SAMPLE: SearchablePlayer[] = [
  { playerName: "Lionel Messi", teamName: "Argentina", position: "FW", shirtNumber: 10 },
  { playerName: "Cristiano Ronaldo", teamName: "Portugal", position: "FW", shirtNumber: 7 },
  { playerName: "Alisson Becker", teamName: "Brazil", position: "GK", shirtNumber: 1 },
  { playerName: "Thibaut Courtois", teamName: "Belgium", position: "GK", shirtNumber: 1 },
];

describe("searchPlayers", () => {
  it("prioriza coincidencia exacta y prefijo", () => {
    const exact = searchPlayers(SAMPLE, "Lionel Messi");
    assert.equal(exact[0]?.playerName, "Lionel Messi");

    const prefix = searchPlayers(SAMPLE, "Crist");
    assert.equal(prefix[0]?.playerName, "Cristiano Ronaldo");
  });

  it("tolera acentos y mayusculas", () => {
    const results = searchPlayers(SAMPLE, "MESSI");
    assert.equal(results[0]?.playerName, "Lionel Messi");
  });

  it("filtra porteros para guante de oro", () => {
    const results = searchPlayers(SAMPLE, "Courtois", { filter: goalkeeperFilter });
    assert.equal(results.length, 1);
    assert.equal(results[0]?.playerName, "Thibaut Courtois");
  });
});
