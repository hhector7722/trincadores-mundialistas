import assert from "node:assert/strict";
import { test } from "node:test";
import {
  composeHeadlineFromBsdIncidents,
  isScoreStyleHeadline,
  pickHeadlineFromBsdSocial,
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

test("composeHeadlineFromBsdIncidents genera frase corta sin marcador", () => {
  const headline = composeHeadlineFromBsdIncidents(
    [
      { type: "goal", minute: 12, player_name: "L. Sone", is_home: true },
      { type: "goal", minute: 73, player_name: "J. Quinones", is_home: true },
    ],
    {
      homeTeam: "Mexico",
      awayTeam: "South Africa",
      homeGoals: 2,
      awayGoals: 0,
    },
  );

  assert.equal(headline, "J. Quinones decide la victoria de México");
  assert.equal(isScoreStyleHeadline(headline!), false);
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
