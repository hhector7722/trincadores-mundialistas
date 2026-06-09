import assert from "node:assert/strict";
import test from "node:test";
import { displayNameInSquad, squadDisplayNames } from "./short-player-name";

test("squadDisplayNames desambigua apellidos repetidos con inicial", () => {
  const names = squadDisplayNames(["Deroy Duarte", "Laros Duarte", "Yannick Semedo", "Willy Semedo"]);
  assert.deepEqual(names, ["D. Duarte", "L. Duarte", "Y. Semedo", "W. Semedo"]);
});

test("displayNameInSquad usa contexto de plantilla", () => {
  const squad = ["Deroy Duarte", "Laros Duarte", "Kevin Pina"];
  assert.equal(displayNameInSquad("Deroy Duarte", squad), "D. Duarte");
  assert.equal(displayNameInSquad("Kevin Pina", squad), "Pina");
});
