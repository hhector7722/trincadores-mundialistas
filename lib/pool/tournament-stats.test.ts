import assert from "node:assert/strict";
import { test } from "node:test";
import { getTournamentStatRows } from "@/lib/pool/tournament-stats";
import type { MatchWithPrediction } from "@/lib/predictions/queries";

function baseMatch(overrides: Partial<MatchWithPrediction> = {}): MatchWithPrediction {
  return {
    id: "m1",
    home_team: "Mexico",
    away_team: "South Africa",
    kickoff_at: "2026-06-11T19:00:00Z",
    status: "finished",
    matchday_name: "Jornada 1",
    matchday_external_key: "group-1",
    external_match_id: null,
    match_number: 1,
    group_code: "A",
    officialHome: 2,
    officialAway: 0,
    officialMvpPlayerName: "J. Quinones",
    officialMvpTeamName: "Mexico",
    highlightYoutubeId: null,
    highlightPublishedAt: null,
    highlightSource: null,
    prediction: null,
    mvpPrediction: null,
    playerIncidents: [],
    serverEditable: false,
    editUntilKickoff: false,
    ...overrides,
  };
}

test("getTournamentStatRows agrega goles, tarjetas y mvp", () => {
  const matches = [
    baseMatch({
      playerIncidents: [
        { kind: "goal", playerName: "J. Quinones", teamSide: "home" },
        { kind: "goal", playerName: "J. Quinones", teamSide: "home" },
        { kind: "assist", playerName: "L. Sone", teamSide: "home" },
        { kind: "yellow_card", playerName: "D. Sugioka", teamSide: "away" },
      ],
    }),
    baseMatch({
      id: "m2",
      officialMvpPlayerName: "J. Quinones",
      playerIncidents: [{ kind: "goal", playerName: "L. Sone", teamSide: "home" }],
    }),
  ];

  assert.deepEqual(getTournamentStatRows("scorers", matches), [
    { label: "J. Quinones", teamName: "Mexico", value: 2 },
    { label: "L. Sone", teamName: "Mexico", value: 1 },
  ]);
  assert.deepEqual(getTournamentStatRows("assists", matches), [
    { label: "L. Sone", teamName: "Mexico", value: 1 },
  ]);
  assert.deepEqual(getTournamentStatRows("yellow_cards", matches), [
    { label: "D. Sugioka", teamName: "South Africa", value: 1 },
  ]);
  assert.deepEqual(getTournamentStatRows("mvp", matches), [
    { label: "J. Quinones", teamName: "Mexico", value: 2 },
  ]);
});
