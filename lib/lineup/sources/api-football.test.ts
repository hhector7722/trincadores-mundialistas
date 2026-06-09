import assert from "node:assert/strict";
import test from "node:test";
import { parseApiFootballTeamLineup } from "./api-football";

const squad = [
  { player_name: "Portero Uno", position: "GK", shirt_number: 1 },
  ...Array.from({ length: 4 }, (_, i) => ({
    player_name: `Defensa ${i + 1}`,
    position: "DF",
    shirt_number: i + 2,
  })),
  ...Array.from({ length: 3 }, (_, i) => ({
    player_name: `Medio ${i + 1}`,
    position: "MF",
    shirt_number: i + 10,
  })),
  ...Array.from({ length: 3 }, (_, i) => ({
    player_name: `Delantero ${i + 1}`,
    position: "FW",
    shirt_number: i + 20,
  })),
];

test("parseApiFootballTeamLineup devuelve confirmed con 11 titulares", () => {
  const payload = {
    team: { name: "Spain" },
    formation: "4-3-3",
    startXI: Array.from({ length: 11 }, (_, i) => ({
      player: {
        name: squad[i].player_name,
        number: squad[i].shirt_number,
        pos: squad[i].position,
      },
      grid: `${Math.floor(i / 3) + 1}:${(i % 3) + 1}`,
    })),
    substitutes: [
      {
        player: { name: "Suplente 1", number: 99, pos: "MF" },
      },
    ],
  };

  const lineup = parseApiFootballTeamLineup(payload, squad);
  assert.ok(lineup);
  assert.equal(lineup.sourceKind, "confirmed");
  assert.equal(lineup.slots.length, 11);
  assert.equal(lineup.bench?.length, 1);
  assert.equal(lineup.isProbable, false);
});

test("parseApiFootballTeamLineup rechaza menos de 11 titulares", () => {
  const payload = {
    formation: "4-3-3",
    startXI: [{ player: { name: "Solo uno", number: 1 } }],
  };
  assert.equal(parseApiFootballTeamLineup(payload, squad), null);
});
