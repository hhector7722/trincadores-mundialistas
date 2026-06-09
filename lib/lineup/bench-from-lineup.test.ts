import assert from "node:assert/strict";
import test from "node:test";
import { resolveBenchPlayers } from "./bench-from-lineup";
import type { ResolvedLineup } from "./types";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";

function lineup(overrides: Partial<ResolvedLineup> = {}): ResolvedLineup {
  return {
    formation: "4-3-3",
    formationLabel: "4-3-3",
    slots: [
      {
        key: "simon-23",
        name: "Unai Simon",
        shirtNumber: 23,
        positionLabel: "POR",
        role: "GK",
        isPlaceholder: false,
        x: 50,
        y: 90,
      },
    ],
    benchCount: 1,
    isProbable: true,
    sourceKind: "predicted",
    dataSourceCode: "bsd",
    fetchedAt: null,
    ...overrides,
  };
}

function squad(players: TeamSquadWithPlayers["players"]): TeamSquadWithPlayers {
  return {
    id: "squad-1",
    team_name: "Spain",
    team_code: "ESP",
    year: 2026,
    competition_code: null,
    label: null,
    source_code: "worldcup2026",
    players,
  };
}

test("resolveBenchPlayers incluye convocados omitidos por BSD", () => {
  const players = resolveBenchPlayers(
    squad([
      { player_name: "Unai Simon", position: "GK", shirt_number: 23, club: null, status: "active" },
      { player_name: "Lamine Yamal", position: "FW", shirt_number: 19, club: null, status: "active" },
      { player_name: "Pedri", position: "MF", shirt_number: 20, club: null, status: "active" },
      { player_name: "Zubimendi", position: "MF", shirt_number: 18, club: null, status: "active" },
    ]),
    lineup({
      bench: [{ key: "zubi-18", name: "Zubimendi", shirtNumber: 18, position: "MF" }],
    })
  );

  assert.deepEqual(players.map((player) => player.name), [
    "Zubimendi",
    "Lamine Yamal",
    "Pedri",
  ]);
});

test("resolveBenchPlayers excluye titulares por dorsal aunque BSD use otro nombre", () => {
  const players = resolveBenchPlayers(
    squad([
      { player_name: "Pedri", position: "MF", shirt_number: 20, club: null, status: "active" },
      { player_name: "Merino", position: "MF", shirt_number: 6, club: null, status: "active" },
      { player_name: "Zubimendi", position: "MF", shirt_number: 18, club: null, status: "active" },
    ]),
    lineup({
      slots: [
        {
          key: "pedri-20",
          name: "Pedri",
          shirtNumber: 20,
          positionLabel: "MED",
          role: "MF",
          isPlaceholder: false,
          x: 50,
          y: 50,
        },
      ],
      bench: [
        { key: "pedri-20", name: "P. Pedri", shirtNumber: 20, position: "MF" },
        { key: "merino-6", name: "Merino", shirtNumber: 6, position: "MF" },
        { key: "merino-6-dup", name: "Merino", shirtNumber: 6, position: "MF" },
      ],
    })
  );

  assert.deepEqual(players.map((player) => player.name), ["Merino", "Zubimendi"]);
});
