import assert from "node:assert/strict";
import { test } from "node:test";
import {
  composeHeadlineFromBsdIncidents,
  isScoreStyleHeadline,
  pickHeadlineFromBsdSocial,
  pickHeadlineVariant,
  truncateHeadline,
} from "@/lib/live/sources/bsd-headline";

test("pickHeadlineFromBsdSocial prioriza cuenta verificada y limpia urls", () => {
  const headline = pickHeadlineFromBsdSocial([
    {
      type: "tweet",
      text: "Partidazo https://t.co/abc #MEX",
      published_at: "2026-06-11T22:00:00Z",
    },
    {
      type: "tweet",
      text: "Quiñones firma un doblete histórico",
      published_at: "2026-06-11T21:00:00Z",
      account: { verified: true },
    },
  ]);

  assert.equal(headline, "Quiñones firma un doblete histórico");
});

test("composeHeadlineFromBsdIncidents usa doblete cuando un jugador anota dos veces", () => {
  const headline = composeHeadlineFromBsdIncidents(
    [
      { type: "goal", minute: 12, player_name: "J. Quinones", is_home: true },
      { type: "goal", minute: 73, player_name: "J. Quinones", is_home: true },
    ],
    {
      homeTeam: "Mexico",
      awayTeam: "South Africa",
      homeGoals: 2,
      awayGoals: 0,
      seed: "match-mex-saf",
    },
  );

  assert.match(headline!, /Doblete de J\. Quinones|anota dos veces|doblete para el triunfo/i);
  assert.equal(isScoreStyleHeadline(headline!), false);
});

test("composeHeadlineFromBsdIncidents ofrece variantes de empate a cero", () => {
  const headline = composeHeadlineFromBsdIncidents(
    [],
    {
      homeTeam: "Brazil",
      awayTeam: "Spain",
      homeGoals: 0,
      awayGoals: 0,
      seed: "match-bra-esp-0",
    },
  );

  assert.match(headline!, /Porterías a cero|Sin goles|Tablas en blanco/i);
});

test("composeHeadlineFromBsdIncidents detecta goleada", () => {
  const headline = composeHeadlineFromBsdIncidents(
    [
      { type: "goal", player_name: "A", is_home: true },
      { type: "goal", player_name: "B", is_home: true },
      { type: "goal", player_name: "C", is_home: true },
      { type: "goal", player_name: "D", is_home: true },
    ],
    {
      homeTeam: "Germany",
      awayTeam: "Scotland",
      homeGoals: 4,
      awayGoals: 0,
      seed: "match-ger-sco",
    },
  );

  assert.match(headline!, /golea|arrasa|Contundente victoria/i);
});

test("composeHeadlineFromBsdIncidents usa asistencia en el gol decisivo", () => {
  const headline = composeHeadlineFromBsdIncidents(
    [
      { type: "goal", player_name: "Kane", is_home: true },
      {
        type: "goal",
        player_name: "Bellingham",
        assist_name: "Foden",
        is_home: true,
      },
    ],
    {
      homeTeam: "England",
      awayTeam: "Serbia",
      homeGoals: 2,
      awayGoals: 1,
      seed: "match-eng-srb",
    },
  );

  assert.match(headline!, /Foden|Asistencia de Foden|pase de Foden/i);
  assert.match(headline!, /Bellingham/i);
});

test("pickHeadlineVariant es estable para la misma semilla", () => {
  const variants = ["A", "B", "C", "D"] as const;
  const first = pickHeadlineVariant("seed-123", variants);
  const second = pickHeadlineVariant("seed-123", variants);
  assert.equal(first, second);
  assert.ok(variants.includes(first as (typeof variants)[number]));
});

test("isScoreStyleHeadline rechaza formatos con marcador o minuto", () => {
  assert.equal(isScoreStyleHeadline("L. Krejčí 59' · KOR 2-1"), true);
  assert.equal(isScoreStyleHeadline("MEX gana 2-0"), true);
  assert.equal(isScoreStyleHeadline("México se impone con solvencia ante Sudáfrica"), false);
});

test("pickHeadlineFromBsdSocial ignora tweets con marcador", () => {
  const headline = pickHeadlineFromBsdSocial([
    {
      type: "tweet",
      text: "KOR 2-1 · gol decisivo 59'",
      published_at: "2026-06-12T10:00:00Z",
      account: { verified: true },
    },
    {
      type: "tweet",
      text: "Corea remonta con personalidad",
      published_at: "2026-06-12T09:00:00Z",
    },
  ]);

  assert.equal(headline, "Corea remonta con personalidad");
});

test("truncateHeadline recorta textos largos", () => {
  const long = "A".repeat(90);
  assert.equal(truncateHeadline(long, 20).length, 20);
  assert.match(truncateHeadline(long, 20), /…$/);
});
