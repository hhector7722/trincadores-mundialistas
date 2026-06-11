import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonicalStoredPlayerName,
  parseOfficialMvpFromFotmobDetails,
  resolveFotmobMatchId,
} from "@/lib/live/sources/fotmob-official-mvp";

test("canonicalStoredPlayerName quita tildes y aplica title case", () => {
  assert.equal(canonicalStoredPlayerName("Julián Quiñones"), "Julian Quinones");
});

test("resolveFotmobMatchId enlaza Mexico vs South Africa", () => {
  const id = resolveFotmobMatchId(
    [
      {
        id: 4667751,
        home: { longName: "Mexico" },
        away: { longName: "South Africa" },
      },
    ],
    "Mexico",
    "South Africa",
  );
  assert.equal(id, 4667751);
});

test("parseOfficialMvpFromFotmobDetails lee playerOfTheMatch dedicado", () => {
  const parsed = parseOfficialMvpFromFotmobDetails(
    {
      content: {
        matchFacts: {
          playerOfTheMatch: {
            name: { fullName: "Julián Quiñones" },
            teamName: "Mexico",
          },
        },
      },
    },
    "Mexico",
  );

  assert.equal(parsed?.playerName, "Julian Quinones");
  assert.equal(parsed?.teamName, "Mexico");
  assert.equal(parsed?.signal, "player_of_the_match");
});
