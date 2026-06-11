import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildTeamAliasIndex,
  isFifaHighlightTitle,
  parseTeamsFromHighlightTitle,
  pickMatchForHighlightVideo,
  resolveTeamLabel,
} from "@/lib/youtube/match-video";

test("isFifaHighlightTitle acepta extended highlights del mundial", () => {
  assert.equal(
    isFifaHighlightTitle("Mexico v South Africa | Extended Highlights | FIFA World Cup 26"),
    true,
  );
  assert.equal(isFifaHighlightTitle("FIFA World Cup Draw 2026"), false);
});

test("parseTeamsFromHighlightTitle extrae equipos del título", () => {
  assert.deepEqual(parseTeamsFromHighlightTitle("MEX v RSA | Extended Highlights | FIFA World Cup 26"), {
    home: "MEX",
    away: "RSA",
  });
});

test("pickMatchForHighlightVideo empareja por abreviatura y ventana temporal", () => {
  const index = buildTeamAliasIndex(["Mexico", "South Africa"]);
  assert.equal(resolveTeamLabel("MEX", index), "Mexico");
  assert.equal(resolveTeamLabel("RSA", index), "South Africa");

  const hit = pickMatchForHighlightVideo(
    "MEX",
    "RSA",
    "2026-06-12T04:00:00.000Z",
    [
      {
        matchId: "match-1",
        homeTeam: "Mexico",
        awayTeam: "South Africa",
        kickoffAt: "2026-06-11T20:00:00.000Z",
      },
    ],
    index,
  );

  assert.equal(hit?.matchId, "match-1");
});
