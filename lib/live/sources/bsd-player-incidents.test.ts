import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mergePlayerIncidents,
  parseBsdIncidentsPlayerEvents,
  parseBsdPlayerStatsIncidents,
} from "@/lib/live/sources/bsd-player-incidents";

test("parseBsdIncidentsPlayerEvents extrae goles, asistencias y tarjetas", () => {
  const rows = parseBsdIncidentsPlayerEvents(
    [
      {
        type: "goal",
        minute: 12,
        player_name: "L. Sone",
        assist_name: "J. Quinones",
        is_home: true,
      },
      {
        type: "goal",
        minute: 73,
        player_name: "J. Quinones",
        is_home: true,
      },
      {
        type: "card",
        minute: 44,
        player: "D. Sugioka",
        card_type: "yellow",
        is_home: false,
      },
      {
        type: "card",
        minute: 88,
        player: "M. Lopez",
        card_type: "yellowRed",
        is_home: true,
      },
    ],
    "Mexico",
    "South Africa",
  );

  assert.equal(rows.filter((row) => row.kind === "goal").length, 2);
  assert.equal(rows.find((row) => row.kind === "goal" && row.playerName === "L. Sone")?.minute, 12);
  assert.equal(rows.filter((row) => row.kind === "assist").length, 1);
  assert.equal(rows.filter((row) => row.kind === "yellow_card").length, 2);
  assert.equal(rows.filter((row) => row.kind === "red_card").length, 1);
});

test("mergePlayerIncidents usa player-stats solo como respaldo", () => {
  const fromIncidents = parseBsdIncidentsPlayerEvents(
    [{ type: "goal", player_name: "J. Quinones", is_home: true }],
    "Mexico",
    "South Africa",
  );
  const fromStats = parseBsdPlayerStatsIncidents(
    {
      player_stats: [
        { player_name: "J. Quinones", goals: 2, goal_assist: 1, team_id: 10 },
        { player_name: "L. Sone", goal_assist: 1, team_id: 10 },
      ],
    },
    10,
    20,
  );

  const merged = mergePlayerIncidents(fromIncidents, fromStats);

  assert.equal(merged.filter((row) => row.kind === "goal").length, 1);
  assert.equal(merged.filter((row) => row.kind === "assist").length, 2);
});
