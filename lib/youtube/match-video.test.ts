import assert from "node:assert/strict";
import { test } from "node:test";
import { FIFA_YOUTUBE_CHANNEL_ID, DAZN_ES_YOUTUBE_CHANNEL_ID, daznEsRssUrl, fifaChannelRssUrl } from "@/lib/youtube/constants";
import {
  buildTeamAliasIndex,
  isDaznHighlightTitle,
  isFifaHighlightTitle,
  isTeledeporteHighlightTitle,
  parseTeamsFromDaznTitle,
  parseTeamsFromHighlightTitle,
  parseTeamsFromTeledeporteTitle,
  pickMatchForHighlightVideo,
  resolveTeamLabel,
} from "@/lib/youtube/match-video";

test("daznEsRssUrl usa el channel ID oficial @DAZNES", () => {
  assert.equal(DAZN_ES_YOUTUBE_CHANNEL_ID, "UCz9FiMLz6SOgR_4VEFvjeIA");
  assert.equal(
    daznEsRssUrl(),
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCz9FiMLz6SOgR_4VEFvjeIA",
  );
});

test("fifaChannelRssUrl usa el channel ID oficial @fifa", () => {
  assert.equal(FIFA_YOUTUBE_CHANNEL_ID, "UCpcTrCXblq78GZrTUTLWeBw");
  assert.equal(
    fifaChannelRssUrl(),
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCpcTrCXblq78GZrTUTLWeBw",
  );
});

test("isDaznHighlightTitle acepta resumenes del mundial", () => {
  assert.equal(
    isDaznHighlightTitle(
      "México vs Sudáfrica (2-0) | Resumen y goles | Highlights Copa Mundial de la FIFA 2026T",
    ),
    true,
  );
  assert.equal(isDaznHighlightTitle("ESTO ES UN MOMENTAZO 🔥"), false);
});

test("parseTeamsFromDaznTitle extrae equipos con marcador embebido", () => {
  assert.deepEqual(
    parseTeamsFromDaznTitle(
      "México vs Sudáfrica (2-0) | Resumen y goles | Highlights Copa Mundial de la FIFA 2026T",
    ),
    { home: "México", away: "Sudáfrica" },
  );
});

test("isFifaHighlightTitle acepta extended highlights del mundial", () => {
  assert.equal(
    isFifaHighlightTitle("Mexico v South Africa | Extended Highlights | FIFA World Cup 26"),
    true,
  );
  assert.equal(isFifaHighlightTitle("FIFA World Cup Draw 2026"), false);
  assert.equal(isFifaHighlightTitle("WATCH LIVE | Mexico v South Africa | FIFA World Cup 2026T"), false);
});

test("parseTeamsFromHighlightTitle extrae equipos del título", () => {
  assert.deepEqual(parseTeamsFromHighlightTitle("MEX v RSA | Extended Highlights | FIFA World Cup 26"), {
    home: "MEX",
    away: "RSA",
  });
  assert.deepEqual(
    parseTeamsFromHighlightTitle("Mexico v South Africa | Extended Highlights | FIFA World Cup 26"),
    { home: "Mexico", away: "South Africa" },
  );
});

test("isTeledeporteHighlightTitle acepta resumenes del mundial", () => {
  assert.equal(
    isTeledeporteHighlightTitle(
      "Resumen México 2 - 0 Sudáfrica | Grupo A | Copa Mundial de la FIFA 2026T",
    ),
    true,
  );
  assert.equal(
    isTeledeporteHighlightTitle("En directo México - Sudáfrica | Copa Mundial de la FIFA 2026T"),
    false,
  );
  assert.equal(
    isTeledeporteHighlightTitle("Resumen Islandia - España (1 - 6) | Clasificatorio mundial"),
    false,
  );
});

test("parseTeamsFromTeledeporteTitle extrae equipos con marcador embebido", () => {
  assert.deepEqual(
    parseTeamsFromTeledeporteTitle(
      "Resumen México 2 - 0 Sudáfrica | Grupo A | Copa Mundial de la FIFA 2026T",
    ),
    { home: "México", away: "Sudáfrica" },
  );
});

test("pickMatchForHighlightVideo resuelve titulos DAZN con alias de medios", () => {
  const index = buildTeamAliasIndex(["South Korea", "Czech Republic"]);
  assert.equal(resolveTeamLabel("República de Corea", index), "South Korea");
  assert.equal(resolveTeamLabel("Chequia", index), "Czech Republic");

  const hit = pickMatchForHighlightVideo(
    "República de Corea",
    "Chequia",
    "2026-06-12T10:00:00.000Z",
    [
      {
        matchId: "match-kor-cze",
        homeTeam: "South Korea",
        awayTeam: "Czech Republic",
        kickoffAt: "2026-06-12T02:00:00.000Z",
      },
    ],
    index,
  );

  assert.equal(hit?.matchId, "match-kor-cze");
});

test("pickMatchForHighlightVideo resuelve nombres en español de Teledeporte", () => {
  const index = buildTeamAliasIndex(["Mexico", "South Africa"]);
  assert.equal(resolveTeamLabel("México", index), "Mexico");
  assert.equal(resolveTeamLabel("Sudáfrica", index), "South Africa");

  const hit = pickMatchForHighlightVideo(
    "México",
    "Sudáfrica",
    "2026-06-12T04:00:00.000Z",
    [
      {
        matchId: "match-mex-rsa",
        homeTeam: "Mexico",
        awayTeam: "South Africa",
        kickoffAt: "2026-06-11T19:00:00.000Z",
      },
    ],
    index,
  );

  assert.equal(hit?.matchId, "match-mex-rsa");
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
