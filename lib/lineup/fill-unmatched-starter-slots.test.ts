import assert from "node:assert/strict";
import test from "node:test";
import type { OfficialSquadPlayer } from "@/lib/lineup/lineup-queries";
import { fillUnmatchedStarterSlotsFromSquad } from "./fill-unmatched-starter-slots";

const official: OfficialSquadPlayer[] = [
  { playerName: "Portero", shirtNumber: 1, position: "GK" },
  { playerName: "Central", shirtNumber: 4, position: "DF" },
  { playerName: "Lateral", shirtNumber: 2, position: "DF" },
  { playerName: "Medio", shirtNumber: 8, position: "MF" },
  { playerName: "Delantero", shirtNumber: 9, position: "FW" },
];

test("fillUnmatchedStarterSlotsFromSquad rellena por rol táctico", () => {
  const usedIdentities = new Set<string>();
  const usedShirts = new Set<number>([9]);

  const filled = fillUnmatchedStarterSlotsFromSquad(
    [
      {
        slotKey: "GK",
        role: "GK",
        key: "gk",
        name: "Por confirmar",
        shirtNumber: null,
        positionLabel: "POR",
        isPlaceholder: true,
      },
      {
        slotKey: "CB",
        role: "DF",
        key: "cb",
        name: "Por confirmar",
        shirtNumber: null,
        positionLabel: "DFC",
        isPlaceholder: true,
      },
      {
        slotKey: "ST",
        role: "FW",
        key: "st",
        name: "Delantero",
        shirtNumber: 9,
        positionLabel: "DC",
        isPlaceholder: false,
      },
    ],
    official,
    usedIdentities,
    usedShirts
  );

  assert.equal(filled[0]?.name, "Portero");
  assert.equal(filled[0]?.shirtNumber, 1);
  assert.equal(filled[1]?.name, "Lateral");
  assert.equal(filled[1]?.shirtNumber, 2);
  assert.equal(filled[2]?.name, "Delantero");
});
