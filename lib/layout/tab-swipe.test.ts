import assert from "node:assert/strict";
import test from "node:test";
import { MAIN_TABS } from "@/lib/layout/main-tabs";
import {
  getTabNeighborForSwipe,
  resolveTabSwipeCommit,
  shouldApplyEdgeResistance,
} from "@/lib/layout/tab-swipe";

const QUIZ = 0;
const TABLA = 1;
const INICIO = 2;
const PARTIDOS = 3;
const PERFIL = 4;

const WIDTH = 400;
const COMMIT_OFFSET = WIDTH * 0.2;

function label(index: number) {
  return MAIN_TABS[index]?.label ?? "?";
}

test("Quiz: deslizar izquierda=La tabla, derecha=nada", () => {
  assert.equal(getTabNeighborForSwipe(QUIZ, "left"), TABLA);
  assert.equal(getTabNeighborForSwipe(QUIZ, "right"), null);
  assert.equal(label(getTabNeighborForSwipe(QUIZ, "left")!), "La tabla");
  assert.equal(resolveTabSwipeCommit(QUIZ, -COMMIT_OFFSET, 0, WIDTH), TABLA);
  assert.equal(resolveTabSwipeCommit(QUIZ, COMMIT_OFFSET, 0, WIDTH), null);
});

test("La tabla: deslizar izquierda=Inicio, derecha=Quiz", () => {
  assert.equal(getTabNeighborForSwipe(TABLA, "left"), INICIO);
  assert.equal(getTabNeighborForSwipe(TABLA, "right"), QUIZ);
  assert.equal(resolveTabSwipeCommit(TABLA, -COMMIT_OFFSET, 0, WIDTH), INICIO);
  assert.equal(resolveTabSwipeCommit(TABLA, COMMIT_OFFSET, 0, WIDTH), QUIZ);
});

test("Inicio: deslizar izquierda=Partidos, derecha=La tabla", () => {
  assert.equal(getTabNeighborForSwipe(INICIO, "left"), PARTIDOS);
  assert.equal(getTabNeighborForSwipe(INICIO, "right"), TABLA);
  assert.equal(resolveTabSwipeCommit(INICIO, -COMMIT_OFFSET, 0, WIDTH), PARTIDOS);
  assert.equal(resolveTabSwipeCommit(INICIO, COMMIT_OFFSET, 0, WIDTH), TABLA);
});

test("Partidos: deslizar izquierda=Perfil, derecha=Inicio", () => {
  assert.equal(getTabNeighborForSwipe(PARTIDOS, "left"), PERFIL);
  assert.equal(getTabNeighborForSwipe(PARTIDOS, "right"), INICIO);
  assert.equal(resolveTabSwipeCommit(PARTIDOS, -COMMIT_OFFSET, 0, WIDTH), PERFIL);
  assert.equal(resolveTabSwipeCommit(PARTIDOS, COMMIT_OFFSET, 0, WIDTH), INICIO);
});

test("Perfil: deslizar izquierda=nada, derecha=Partidos", () => {
  assert.equal(getTabNeighborForSwipe(PERFIL, "left"), null);
  assert.equal(getTabNeighborForSwipe(PERFIL, "right"), PARTIDOS);
  assert.equal(resolveTabSwipeCommit(PERFIL, -COMMIT_OFFSET, 0, WIDTH), null);
  assert.equal(resolveTabSwipeCommit(PERFIL, COMMIT_OFFSET, 0, WIDTH), PARTIDOS);
});

test("bordes aplican resistencia", () => {
  assert.equal(shouldApplyEdgeResistance(QUIZ, "left"), false);
  assert.equal(shouldApplyEdgeResistance(QUIZ, "right"), true);
  assert.equal(shouldApplyEdgeResistance(PERFIL, "left"), true);
  assert.equal(shouldApplyEdgeResistance(PERFIL, "right"), false);
});
