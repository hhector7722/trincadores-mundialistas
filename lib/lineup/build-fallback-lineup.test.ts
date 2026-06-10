import assert from "node:assert/strict";
import test from "node:test";
import { buildFallbackLineup } from "./build-fallback-lineup";

const spainLikeSquad = [
  { player_name: "David Raya", position: "GK", shirt_number: 1 },
  { player_name: "Marc Pubill", position: "DF", shirt_number: 2 },
  { player_name: "Alex Grimaldo", position: "DF", shirt_number: 3 },
  { player_name: "Eric Garcia", position: "DF", shirt_number: 4 },
  { player_name: "Marcos Llorente", position: "DF", shirt_number: 5 },
  { player_name: "Mikel Merino", position: "MF", shirt_number: 6 },
  { player_name: "Ferran Torres", position: "FW", shirt_number: 7 },
  { player_name: "Fabian Ruiz", position: "MF", shirt_number: 8 },
  { player_name: "Gavi", position: "MF", shirt_number: 9 },
  { player_name: "Dani Olmo", position: "FW", shirt_number: 10 },
  { player_name: "Pedro Porro", position: "DF", shirt_number: 12 },
];

test("buildFallbackLineup infiere 5-3-2 sin formación conocida", () => {
  const result = buildFallbackLineup(spainLikeSquad);
  assert.equal(result.formation, "5-3-2");
  assert.equal(result.sourceKind, "fallback");
});

test("buildFallbackLineup usa knownFormation en lugar de pickFormation", () => {
  const result = buildFallbackLineup(spainLikeSquad, { knownFormation: "4-2-3-1" });
  assert.equal(result.formation, "4-2-3-1");
  assert.equal(result.formationLabel, "4-2-3-1");
});
