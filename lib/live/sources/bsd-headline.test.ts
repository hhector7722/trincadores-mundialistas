import assert from "node:assert/strict";
import { test } from "node:test";
import {
  composeHeadlineFromBsdIncidents,
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
      text: "Quiñones firma un doblete histórico en el debut",
      published_at: "2026-06-11T21:00:00Z",
      account: { verified: true },
    },
  ]);

  assert.equal(headline, "Quiñones firma un doblete histórico en el debut");
});

test("pickHeadlineFromBsdSocial descarta lineas de marcador", () => {
  const headline = pickHeadlineFromBsdSocial([
    {
      type: "tweet",
      text: "MEX 2-0 RSA",
      published_at: "2026-06-11T22:00:00Z",
      account: { verified: true },
    },
  ]);

  assert.equal(headline, null);
});

test("composeHeadlineFromBsdIncidents genera frase con doblete", () => {
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
    },
  );

  assert.equal(headline, "Quinones firma un doblete y México gana");
});

test("composeHeadlineFromBsdIncidents genera titular de victoria trabajada", () => {
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

  assert.equal(headline, "México se impone con solvencia ante Sudáfrica");
});

test("composeHeadlineFromBsdIncidents genera titular de goleada", () => {
  const headline = composeHeadlineFromBsdIncidents(
    [],
    {
      homeTeam: "Brazil",
      awayTeam: "Haiti",
      homeGoals: 4,
      awayGoals: 0,
    },
  );

  assert.equal(headline, "Goleada de Brasil ante Haití");
});

test("truncateHeadline recorta textos largos", () => {
  const long = "A".repeat(90);
  assert.equal(truncateHeadline(long, 20).length, 20);
  assert.match(truncateHeadline(long, 20), /…$/);
});
