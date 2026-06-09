import assert from "node:assert/strict";
import test from "node:test";
import { parseBsdPredictedTeamLineup } from "./bsd-lineup-parse";

const squad = Array.from({ length: 11 }, (_, i) => ({
  player_name: `Jugador ${i + 1}`,
  position: i === 0 ? "GK" : i < 5 ? "DF" : i < 8 ? "MF" : "FW",
  shirt_number: i + 1,
}));

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

  const lineup = parseBsdPredictedTeamLineup(payload, squad, "2026-06-08T20:31:18.804286+00:00");
  assert.ok(lineup);
  assert.equal(lineup.sourceKind, "predicted");
  assert.equal(lineup.dataSourceCode, "bsd");
  assert.equal(lineup.slots.length, 11);
  assert.equal(lineup.bench?.length, 1);
});
