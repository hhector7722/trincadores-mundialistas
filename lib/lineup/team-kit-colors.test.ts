import assert from "node:assert/strict";
import test from "node:test";
import { getTeamKitColors, teamKitColorsClash } from "@/lib/lineup/team-kit-colors";

test("getTeamKitColors usa color de camiseta y dorsal con contraste", () => {
  const spain = getTeamKitColors("Spain");
  assert.equal(spain.kit, "#C60B1E");
  assert.equal(spain.dorsal, "#FFFFFF");

  const brazil = getTeamKitColors("Brazil");
  assert.equal(brazil.kit, "#FFE900");
  assert.equal(brazil.dorsal, "#111111");

  const england = getTeamKitColors("England");
  assert.equal(england.kit, "#FFFFFF");
  assert.equal(england.dorsal, "#111111");
});

test("getTeamKitColors resuelve equipos con slug alternativo", () => {
  const bosnia = getTeamKitColors("Bosnia & Herzegovina");
  assert.equal(bosnia.kit, "#002395");
});

test("South Africa usa camiseta amarilla titular", () => {
  const rsa = getTeamKitColors("South Africa");
  assert.equal(rsa.kit, "#FECC00");
  assert.equal(rsa.dorsal, "#111111");
});

test("teamKitColorsClash detecta camisetas titulares iguales", () => {
  assert.equal(teamKitColorsClash("England", "Germany"), true);
  assert.equal(teamKitColorsClash("Spain", "Brazil"), false);
});

test("teamKitColorsClash detecta camisetas parecidas aunque no sean idénticas", () => {
  assert.equal(teamKitColorsClash("Spain", "Morocco"), true);
  assert.equal(teamKitColorsClash("Belgium", "Austria"), true);
  assert.equal(teamKitColorsClash("France", "Bosnia & Herzegovina"), true);
  assert.equal(teamKitColorsClash("Spain", "Netherlands"), false);
});
