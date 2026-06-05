import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCupFinalsTxt } from "./parse-cup-finals";
import { parseCupTxt } from "./parse-football-txt";
import { parseStadiumsCsv } from "./parse-stadiums-csv";
import { buildKickoffIso, parseDateKey } from "./kickoff";

test("parseDateKey acepta June y Jun", () => {
  assert.equal(parseDateKey("Thu June 11", 2026), "2026-06-11");
  assert.equal(parseDateKey("▪ Matchday 1 | Thu Jun 11", 2026), "2026-06-11");
});

test("buildKickoffIso respeta offset UTC-6", () => {
  assert.equal(
    buildKickoffIso("2026-06-11", "13:00", "UTC-6"),
    "2026-06-11T13:00:00-06:00"
  );
});

test("parseStadiumsCsv lee filas de estadios", () => {
  const csv = `city, timezone, cc, name, capacity, wikipedia, wikidata, coords
Mexico City, UTC-6, mx, Estadio Azteca, 83000, Estadio_Azteca, Q320454, 19°18'11"N 99°09'02"W`;
  const rows = parseStadiumsCsv(csv);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].city, "Mexico City");
  assert.equal(rows[0].stadiumName, "Estadio Azteca");
});

test("parseCupTxt extrae 48 equipos y 72 partidos de grupos", () => {
  const sample = `= World Cup 2026 # in Canada, USA, and Mexico

Group A | Mexico  South Africa  South Korea  Czech Republic

▪ Matchday 1 | Thu Jun 11
▪ Group A
Thu June 11
  13:00 UTC-6  Mexico  v  South Africa  @ Mexico City
  20:00 UTC-6  South Korea  v  Czech Republic  @ Guadalajara (Zapopan)
`;
  const parsed = parseCupTxt(sample, 2026);
  assert.equal(parsed.teams.length, 4);
  assert.equal(parsed.groupMatches.length, 2);
  assert.equal(parsed.groupMatches[0].externalMatchId, "WC2026-G-A-1");
  assert.equal(parsed.groupMatches[0].homeTeam, "Mexico");
});

test("parseCupFinalsTxt extrae partidos KO numerados", () => {
  const sample = `= World Cup 2026

▪ Round of 32
Sun Jun 28
 (73) 12:00 UTC-7  2A  v  2B  @ Los Angeles (Inglewood)
`;
  const parsed = parseCupFinalsTxt(sample, 2026);
  assert.equal(parsed.knockoutMatches.length, 1);
  assert.equal(parsed.knockoutMatches[0].externalMatchId, "WC2026-M073");
  assert.equal(parsed.knockoutMatches[0].homeTeam, "2A");
});
