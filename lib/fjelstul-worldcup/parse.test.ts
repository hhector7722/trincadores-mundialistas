import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsvContent, readBool, readInt } from "./parse-csv";
import {
  isMenTournament,
  normalizeTournaments,
  normalizeTeams,
  playerDisplayName,
} from "./normalize";

test("parseCsvContent respeta comillas con comas", () => {
  const csv = `a,b\n"Korea, Japan",1`;
  const rows = parseCsvContent(csv);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].a, "Korea, Japan");
  assert.equal(rows[0].b, "1");
});

test("readBool y readInt", () => {
  assert.equal(readBool("1"), true);
  assert.equal(readBool("0"), false);
  assert.equal(readInt("42"), 42);
  assert.equal(readInt(""), null);
});

test("playerDisplayName maneja monónimos", () => {
  assert.equal(playerDisplayName("Pelé", "not applicable"), "Pelé");
  assert.equal(playerDisplayName("Lineker", "Gary"), "Gary Lineker");
});

test("normalizeTournaments infiere gender", () => {
  const csv = `key_id,tournament_id,tournament_name,year,start_date,end_date,host_country,winner
1,WC-2022,2022 FIFA Men's World Cup,2022,2022-11-20,2022-12-18,Qatar,Argentina
2,WC-2019,2019 FIFA Women's World Cup,2019,2019-06-07,2019-07-07,France,United States`;
  const rows = normalizeTournaments(csv);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].gender, "men");
  assert.equal(rows[1].gender, "women");
  assert.equal(isMenTournament(rows[0].external_id, { name: rows[0].name, gender: rows[0].gender }), true);
  assert.equal(isMenTournament(rows[1].external_id, { name: rows[1].name, gender: rows[1].gender }), false);
});

test("normalizeTeams lee team_id", () => {
  const csv = `key_id,team_id,team_name,team_code,confederation_name
1,T-09,Brazil,BRA,CONMEBOL`;
  const rows = normalizeTeams(csv);
  assert.equal(rows[0].external_id, "T-09");
  assert.equal(rows[0].code, "BRA");
});
