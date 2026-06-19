import assert from "node:assert/strict";
import { test } from "node:test";
import { mvpTeamsMatch, isMvpPredictionCorrect } from "@/lib/predictions/mvp-name-match";
import { resolveOfficialMvpAgainstSquadPlayers } from "@/lib/predictions/resolve-official-mvp-squad";

const SWITZERLAND_SQUAD = [
  {
    playerName: "Johan Manzambi",
    teamName: "Switzerland",
    shirtNumber: 9,
    externalPlayerKey: "502727",
  },
  {
    playerName: "Granit Xhaka",
    teamName: "Switzerland",
    shirtNumber: 10,
    externalPlayerKey: "500001",
  },
];

test("mvpTeamsMatch acepta alias de selección", () => {
  assert.equal(mvpTeamsMatch("Bosnia & Herzegovina", "Bosnia and Herzegovina"), true);
  assert.equal(mvpTeamsMatch("Ivory Coast", "Côte d'Ivoire"), true);
  assert.equal(mvpTeamsMatch("USA", "United States"), true);
  assert.equal(mvpTeamsMatch("South Korea", "Korea Republic"), true);
});

test("isMvpPredictionCorrect usa alias de selección", () => {
  assert.equal(
    isMvpPredictionCorrect("Johan Manzambi", "Switzerland", "Johan Manzambi", "Switzerland"),
    true,
  );
  assert.equal(
    isMvpPredictionCorrect(
      "Kerim Alajbegovic",
      "Bosnia & Herzegovina",
      "Kerim Alajbegovic",
      "Bosnia and Herzegovina",
    ),
    true,
  );
});

test("resolveOfficialMvpAgainstSquadPlayers prioriza idPlayer FIFA", () => {
  const resolved = resolveOfficialMvpAgainstSquadPlayers(
    SWITZERLAND_SQUAD,
    {
      playerName: "J. Manzambi",
      teamName: "Switzerland",
      fifaPlayerId: "502727",
    },
    [],
  );

  assert.deepEqual(resolved, {
    playerName: "Johan Manzambi",
    teamName: "Switzerland",
  });
});

test("resolveOfficialMvpAgainstSquadPlayers resuelve por dorsal y nombre FIFA", () => {
  const resolved = resolveOfficialMvpAgainstSquadPlayers(
    SWITZERLAND_SQUAD,
    {
      playerName: "Johan Manzambi",
      teamName: "Switzerland",
      shirtNumber: 9,
    },
    [],
  );

  assert.deepEqual(resolved, {
    playerName: "Johan Manzambi",
    teamName: "Switzerland",
  });
});

test("resolveOfficialMvpAgainstSquadPlayers canoniza selección FIFA a OpenFootball", () => {
  const resolved = resolveOfficialMvpAgainstSquadPlayers(
    [
      {
        playerName: "Edin Dzeko",
        teamName: "Bosnia & Herzegovina",
        shirtNumber: 11,
        externalPlayerKey: "300409",
      },
    ],
    {
      playerName: "Edin Dzeko",
      teamName: "Bosnia and Herzegovina",
    },
    [],
  );

  assert.deepEqual(resolved, {
    playerName: "Edin Dzeko",
    teamName: "Bosnia & Herzegovina",
  });
});
