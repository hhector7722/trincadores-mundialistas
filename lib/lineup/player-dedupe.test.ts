import assert from "node:assert/strict";
import test from "node:test";
import { dedupePlayersByIdentity } from "./player-dedupe";

test("dedupePlayersByIdentity elimina duplicados por dorsal", () => {
  const players = dedupePlayersByIdentity([
    { name: "Mohamed Salah", shirtNumber: 10 },
    { name: "M. Salah", shirtNumber: 10 },
    { name: "Ederson", shirtNumber: 23 },
    { name: "Ederson M.", shirtNumber: 23 },
  ]);

  assert.equal(players.length, 2);
});
