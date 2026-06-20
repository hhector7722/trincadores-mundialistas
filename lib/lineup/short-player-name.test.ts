import assert from "node:assert/strict";
import test from "node:test";
import {
  abbreviateMvpFieldLabel,
  displayNameInSquad,
  mvpFieldDisplayName,
  shirtPlayerName,
  squadDisplayNames,
} from "./short-player-name";

test("shirtPlayerName incluye nombre de pila con sufijo Jr/Junior", () => {
  assert.equal(shirtPlayerName("Vinicius Junior"), "Vinicius Junior");
  assert.equal(shirtPlayerName("Vinicius Jr"), "Vinicius Jr");
  assert.equal(shirtPlayerName("Neymar Jr"), "Neymar Jr");
  assert.equal(shirtPlayerName("Gabriel Magalhaes"), "Magalhaes");
});

test("squadDisplayNames desambigua apellidos repetidos con inicial", () => {
  const names = squadDisplayNames(["Deroy Duarte", "Laros Duarte", "Yannick Semedo", "Willy Semedo"]);
  assert.deepEqual(names, ["D. Duarte", "L. Duarte", "Y. Semedo", "W. Semedo"]);
});

test("displayNameInSquad usa contexto de plantilla", () => {
  const squad = ["Deroy Duarte", "Laros Duarte", "Kevin Pina"];
  assert.equal(displayNameInSquad("Deroy Duarte", squad), "D. Duarte");
  assert.equal(displayNameInSquad("Kevin Pina", squad), "Pina");
});

test("abbreviateMvpFieldLabel acorta apellidos largos en campo MVP", () => {
  assert.equal(abbreviateMvpFieldLabel("Hadzikadunic"), "Hadzikad.");
  assert.equal(abbreviateMvpFieldLabel("Rodriguez"), "Rodrig.");
  assert.equal(abbreviateMvpFieldLabel("Muharemovic"), "Muharem.");
  assert.equal(abbreviateMvpFieldLabel("Pina"), "Pina");
});

test("mvpFieldDisplayName combina desambiguación y abreviatura", () => {
  assert.equal(mvpFieldDisplayName("Edin Dzeko"), "Dzeko");
  assert.equal(mvpFieldDisplayName("Some Longsurnameplayer"), "Longsurn.");
});

test("mvpFieldDisplayName distingue Vinicius y Neymar en campo", () => {
  const squad = ["Vinicius Junior", "Neymar Jr", "Raphinha"];
  assert.equal(mvpFieldDisplayName("Vinicius Junior", squad), "Vinicius.");
  assert.equal(mvpFieldDisplayName("Neymar Jr", squad), "Neymar.");
});
