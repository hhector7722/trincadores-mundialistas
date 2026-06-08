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

test("Quiz: izquierda=nada, derecha=La tabla", () => {
  assert.equal(getTabNeighborForSwipe(QUIZ, "left"), null);
  assert.equal(getTabNeighborForSwipe(QUIZ, "right"), TABLA);
  assert.equal(label(getTabNeighborForSwipe(QUIZ, "right")!), "La tabla");
  assert.equal(resolveTabSwipeCommit(QUIZ, -COMMIT_OFFSET, 0, WIDTH), null);
  assert.equal(resolveTabSwipeCommit(QUIZ, COMMIT_OFFSET, 0, WIDTH), TABLA);
});

test("La tabla: izquierda=Quiz, derecha=Inicio", () => {
  assert.equal(getTabNeighborForSwipe(TABLA, "left"), QUIZ);
  assert.equal(getTabNeighborForSwipe(TABLA, "right"), INICIO);
  assert.equal(resolveTabSwipeCommit(TABLA, -COMMIT_OFFSET, 0, WIDTH), QUIZ);
  assert.equal(resolveTabSwipeCommit(TABLA, COMMIT_OFFSET, 0, WIDTH), INICIO);
});

test("Inicio: izquierda=La tabla, derecha=Partidos", () => {
  assert.equal(getTabNeighborForSwipe(INICIO, "left"), TABLA);
  assert.equal(getTabNeighborForSwipe(INICIO, "right"), PARTIDOS);
  assert.equal(resolveTabSwipeCommit(INICIO, -COMMIT_OFFSET, 0, WIDTH), TABLA);
  assert.equal(resolveTabSwipeCommit(INICIO, COMMIT_OFFSET, 0, WIDTH), PARTIDOS);
});

test("Partidos: izquierda=Inicio, derecha=Perfil", () => {
  assert.equal(getTabNeighborForSwipe(PARTIDOS, "left"), INICIO);
  assert.equal(getTabNeighborForSwipe(PARTIDOS, "right"), PERFIL);
  assert.equal(resolveTabSwipeCommit(PARTIDOS, -COMMIT_OFFSET, 0, WIDTH), INICIO);
  assert.equal(resolveTabSwipeCommit(PARTIDOS, COMMIT_OFFSET, 0, WIDTH), PERFIL);
});

test("Perfil: izquierda=Partidos, derecha=nada", () => {
  assert.equal(getTabNeighborForSwipe(PERFIL, "left"), PARTIDOS);
  assert.equal(getTabNeighborForSwipe(PERFIL, "right"), null);
  assert.equal(resolveTabSwipeCommit(PERFIL, -COMMIT_OFFSET, 0, WIDTH), PARTIDOS);
  assert.equal(resolveTabSwipeCommit(PERFIL, COMMIT_OFFSET, 0, WIDTH), null);
});

test("bordes aplican resistencia", () => {
  assert.equal(shouldApplyEdgeResistance(QUIZ, "left"), true);
  assert.equal(shouldApplyEdgeResistance(QUIZ, "right"), false);
  assert.equal(shouldApplyEdgeResistance(PERFIL, "left"), false);
  assert.equal(shouldApplyEdgeResistance(PERFIL, "right"), true);
});
