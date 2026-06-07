import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterByMenTournaments,
  isMenTournament,
  isWomenTournament,
  menTournamentExternalIds,
  normalizeMatches,
  normalizeTournaments,
  onlyMenTournaments,
  WOMENS_WC_TOURNAMENT_IDS,
} from "./normalize";

const TOURNAMENT_CSV = `key_id,tournament_id,tournament_name,year,start_date,end_date,host_country,winner
1,WC-2022,2022 FIFA Men's World Cup,2022,2022-11-20,2022-12-18,Qatar,Argentina
2,WC-2019,2019 FIFA Women's World Cup,2019,2019-06-07,2019-07-07,France,United States
3,WC-2018,2018 FIFA Men's World Cup,2018,2018-06-14,2018-07-15,Russia,France`;

test("isWomenTournament detecta por ID y nombre", () => {
  assert.equal(isWomenTournament("WC-2019", "2019 FIFA Women's World Cup"), true);
  assert.equal(isWomenTournament("WC-2022", "2022 FIFA Men's World Cup"), false);
  assert.equal(isWomenTournament("WC-XXXX", "2024 FIFA Femenin World Cup"), true);
});

test("isMenTournament acepta masculinos y rechaza femeninos", () => {
  assert.equal(isMenTournament("WC-2022", { name: "2022 FIFA Men's World Cup" }), true);
  assert.equal(isMenTournament("WC-2019", { name: "2019 FIFA Women's World Cup" }), false);
  assert.equal(isMenTournament("WC-2019", { gender: "women" }), false);
  assert.equal(isMenTournament("WC-2022", { gender: "men" }), true);
});

test("onlyMenTournaments excluye los 8 IDs femeninos canónicos", () => {
  const all = normalizeTournaments(TOURNAMENT_CSV);
  const men = onlyMenTournaments(all);
  assert.equal(all.length, 3);
  assert.equal(men.length, 2);
  assert.deepEqual(
    men.map((t) => t.external_id),
    ["WC-2022", "WC-2018"]
  );
  for (const id of WOMENS_WC_TOURNAMENT_IDS) {
    assert.ok(!men.some((t) => t.external_id === id));
  }
});

test("filterByMenTournaments excluye partidos de torneos femeninos", () => {
  const menIds = menTournamentExternalIds(normalizeTournaments(TOURNAMENT_CSV));
  const matchCsv = `key_id,match_id,tournament_id,home_team_id,away_team_id,stadium_id,match_date,match_time,stage_name,group_name,home_team_score,away_team_score,extra_time,penalty_shootout
1,M-1,WC-2022,T-01,T-02,S-01,2022-12-18,15:00,Final,,3,3,1,1
2,M-2,WC-2019,T-03,T-04,S-02,2019-07-07,17:00,Final,,2,0,0,0`;
  const matches = filterByMenTournaments(normalizeMatches(matchCsv), menIds);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].tournament_external_id, "WC-2022");
});

test("generador de facts no incluye años de Mundiales femeninos", () => {
  const men = onlyMenTournaments(normalizeTournaments(TOURNAMENT_CSV));
  const womenYears = new Set([1991, 1995, 1999, 2003, 2007, 2011, 2015, 2019]);

  const winnerFacts = men
    .filter((t) => t.winner)
    .map((t) => ({ year: t.year, subject: `Mundial ${t.year}` }));

  for (const fact of winnerFacts) {
    assert.ok(!womenYears.has(fact.year), `fact femenino detectado: ${fact.subject}`);
  }
  assert.ok(!winnerFacts.some((f) => f.year === 2019));
  assert.ok(winnerFacts.some((f) => f.year === 2022));
});
