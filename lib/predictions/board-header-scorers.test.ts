import assert from "node:assert/strict";
import { test } from "node:test";
import {
  boardMvpPlayerNamesMatch,
  buildBoardHeaderTeamScorerBlock,
  groupBoardGoalScorersByPlayer,
} from "@/lib/predictions/board-header-scorers";

test("boardMvpPlayerNamesMatch une nombre FIFA y apellido camiseta", () => {
  assert.equal(boardMvpPlayerNamesMatch("Nestory Irankunda", "Irankunda"), true);
  assert.equal(boardMvpPlayerNamesMatch("Irankunda", "Nestory Irankunda"), true);
  assert.equal(boardMvpPlayerNamesMatch("Metcalfe", "Irankunda"), false);
});

test("groupBoardGoalScorersByPlayer fusiona variantes del mismo jugador", () => {
  const groups = groupBoardGoalScorersByPlayer([
    { playerName: "Nestory Irankunda", minute: 27 },
    { playerName: "Irankunda", minute: 90 },
  ]);

  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0]?.minutes, [27, 90]);
});

test("opción 1: MVP goleador resalta su fila y no crea fila extra", () => {
  const block = buildBoardHeaderTeamScorerBlock(
    [
      { playerName: "Metcalfe", minute: 75 },
      { playerName: "Irankunda", minute: 27 },
    ],
    "Irankunda",
    true,
  );

  assert.equal(block.mvpOnlyName, null);
  assert.equal(block.scorerRows.length, 2);
  assert.equal(block.scorerRows[0]?.highlightMvpName, false);
  assert.equal(block.scorerRows[1]?.highlightMvpName, true);
});

test("opción 1: MVP oficial con nombre largo y gol con apellido no duplica", () => {
  const block = buildBoardHeaderTeamScorerBlock(
    [
      { playerName: "Metcalfe", minute: 75 },
      { playerName: "Nestory Irankunda", minute: 27 },
    ],
    "Irankunda",
    true,
  );

  assert.equal(block.mvpOnlyName, null);
  assert.equal(block.scorerRows.length, 2);
  assert.equal(block.scorerRows[1]?.highlightMvpName, true);
});

test("opción 1: MVP con varios goles mantiene una sola fila resaltada", () => {
  const block = buildBoardHeaderTeamScorerBlock(
    [
      { playerName: "Ronaldo", minute: 12 },
      { playerName: "Ronaldo", minute: 28 },
    ],
    "Ronaldo",
    true,
  );

  assert.equal(block.mvpOnlyName, null);
  assert.equal(block.scorerRows.length, 1);
  assert.equal(block.scorerRows[0]?.highlightMvpName, true);
  assert.deepEqual(block.scorerRows[0]?.group.minutes, [12, 28]);
});

test("opción 2: MVP sin gol crea fila nueva solo con nombre", () => {
  const block = buildBoardHeaderTeamScorerBlock(
    [{ playerName: "Metcalfe", minute: 75 }],
    "Guler",
    true,
  );

  assert.equal(block.mvpOnlyName, "Guler");
  assert.equal(block.scorerRows.length, 1);
  assert.equal(block.scorerRows[0]?.highlightMvpName, false);
});

test("sin MVP oficial no crea fila extra ni resalta goleadores", () => {
  const block = buildBoardHeaderTeamScorerBlock(
    [{ playerName: "Metcalfe", minute: 75 }],
    null,
    true,
  );

  assert.equal(block.mvpOnlyName, null);
  assert.equal(block.scorerRows[0]?.highlightMvpName, false);
});
