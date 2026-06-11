import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildFifaCalendarLookup,
  findFifaTimelineMvpPlayerId,
  parseOfficialMvpFromFifaLive,
  resolveFifaMatchFromCalendar,
} from "@/lib/live/sources/fifa-official-mvp";

test("buildFifaCalendarLookup resuelve MEX vs RSA por fecha UTC", () => {
  const lookup = buildFifaCalendarLookup([
    {
      IdMatch: "400021443",
      IdStage: "289273",
      IdSeason: "285023",
      IdCompetition: "17",
      Date: "2026-06-11T19:00:00Z",
      Home: { Abbreviation: "MEX" },
      Away: { Abbreviation: "RSA" },
    },
  ]);

  const hit = resolveFifaMatchFromCalendar(
    lookup,
    "Mexico",
    "South Africa",
    "2026-06-11T19:00:00.000Z",
  );

  assert.equal(hit?.idMatch, "400021443");
  assert.equal(hit?.homeCode, "MEX");
});

test("findFifaTimelineMvpPlayerId detecta evento explícito POTM", () => {
  const id = findFifaTimelineMvpPlayerId({
    Event: [
      {
        TypeLocalized: [{ Locale: "en-GB", Description: "Player of the Match" }],
        IdPlayer: "395516",
      },
    ],
  });

  assert.equal(id, "395516");
});

test("parseOfficialMvpFromFifaLive lee campo dedicado PlayerOfTheMatch", () => {
  const parsed = parseOfficialMvpFromFifaLive(
    {
      PlayerOfTheMatch: {
        PlayerName: [{ Locale: "en-GB", Description: "Julian QUINONES" }],
        Abbreviation: "MEX",
      },
      HomeTeam: { Abbreviation: "MEX", Players: [] },
      AwayTeam: { Abbreviation: "RSA", Players: [] },
    },
    "Mexico",
    "South Africa",
    {
      idMatch: "400021443",
      idStage: "289273",
      idSeason: "285023",
      idCompetition: "17",
      homeCode: "MEX",
      awayCode: "RSA",
    },
  );

  assert.equal(parsed?.playerName, "Julian Quinones");
  assert.equal(parsed?.teamName, "Mexico");
});
