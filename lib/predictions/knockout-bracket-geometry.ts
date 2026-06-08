import type { BracketRoundKey } from "@/lib/predictions/knockout-bracket-layout";

export const BRACKET_COLUMN_COUNT = 9;
export const BRACKET_LEAF_SLOTS = 16;
export const BRACKET_VERTICAL_PAD = 1.5;

/** Posición X del círculo local en la final (centro del árbol). */
export const FINAL_HOME_X = 44;
/** Posición X del círculo visitante en la final. */
export const FINAL_AWAY_X = 56;
export const FINAL_CENTER_Y = 50;

export type BracketMatchGeometry = {
  matchNumber: number;
  round: BracketRoundKey;
  side: "left" | "right" | "center";
  column: number;
  homeY: number;
  awayY: number;
  midY: number;
  columnX: number;
  childMatches?: [number, number];
};

const LEFT_R32 = [73, 75, 74, 77, 83, 84, 81, 82] as const;
const LEFT_R16 = [90, 89, 93, 94] as const;
const LEFT_QF = [97, 98] as const;
const LEFT_SF = [101] as const;

const RIGHT_R32 = [76, 78, 79, 80, 85, 86, 87, 88] as const;
const RIGHT_R16 = [91, 92, 95, 96] as const;
const RIGHT_QF = [99, 100] as const;
const RIGHT_SF = [102] as const;

function scaleY(raw: number): number {
  const usable = 100 - BRACKET_VERTICAL_PAD * 2;
  return BRACKET_VERTICAL_PAD + (raw / 100) * usable;
}

export function leafSpanY(startLeaf: number, leafSpan: number) {
  const homeRaw = ((startLeaf + leafSpan / 4) / BRACKET_LEAF_SLOTS) * 100;
  const awayRaw = ((startLeaf + (3 * leafSpan) / 4) / BRACKET_LEAF_SLOTS) * 100;
  const midRaw = ((startLeaf + leafSpan / 2) / BRACKET_LEAF_SLOTS) * 100;
  return {
    homeY: scaleY(homeRaw),
    awayY: scaleY(awayRaw),
    midY: scaleY(midRaw),
  };
}

export function columnCenterX(column: number): number {
  return ((column + 0.5) / BRACKET_COLUMN_COUNT) * 100;
}

export function columnEdgeX(column: number, edge: "left" | "right"): number {
  return edge === "left"
    ? (column / BRACKET_COLUMN_COUNT) * 100
    : ((column + 1) / BRACKET_COLUMN_COUNT) * 100;
}

function pushRound(
  out: BracketMatchGeometry[],
  matchNumbers: readonly number[],
  round: BracketRoundKey,
  side: "left" | "right",
  column: number,
  leafSpan: number,
  childGroups?: readonly number[][]
) {
  matchNumbers.forEach((matchNumber, index) => {
    const startLeaf = index * leafSpan;
    const y = leafSpanY(startLeaf, leafSpan);
    const childMatches = childGroups?.[index] as [number, number] | undefined;
    out.push({
      matchNumber,
      round,
      side,
      column,
      ...y,
      columnX: columnCenterX(column),
      childMatches,
    });
  });
}

export function buildBracketGeometry(): BracketMatchGeometry[] {
  const matches: BracketMatchGeometry[] = [];

  pushRound(matches, LEFT_R32, "r32", "left", 0, 2);
  pushRound(matches, LEFT_R16, "r16", "left", 1, 4, [
    [LEFT_R32[0], LEFT_R32[1]],
    [LEFT_R32[2], LEFT_R32[3]],
    [LEFT_R32[4], LEFT_R32[5]],
    [LEFT_R32[6], LEFT_R32[7]],
  ]);
  pushRound(matches, LEFT_QF, "qf", "left", 2, 8, [
    [LEFT_R16[0], LEFT_R16[1]],
    [LEFT_R16[2], LEFT_R16[3]],
  ]);
  pushRound(matches, LEFT_SF, "sf", "left", 3, 16, [[LEFT_QF[0], LEFT_QF[1]]]);

  pushRound(matches, RIGHT_R32, "r32", "right", 8, 2);
  pushRound(matches, RIGHT_R16, "r16", "right", 7, 4, [
    [RIGHT_R32[0], RIGHT_R32[1]],
    [RIGHT_R32[2], RIGHT_R32[3]],
    [RIGHT_R32[4], RIGHT_R32[5]],
    [RIGHT_R32[6], RIGHT_R32[7]],
  ]);
  pushRound(matches, RIGHT_QF, "qf", "right", 6, 8, [
    [RIGHT_R16[0], RIGHT_R16[1]],
    [RIGHT_R16[2], RIGHT_R16[3]],
  ]);
  pushRound(matches, RIGHT_SF, "sf", "right", 5, 16, [[RIGHT_QF[0], RIGHT_QF[1]]]);

  matches.push({
    matchNumber: 104,
    round: "final",
    side: "center",
    column: 4,
    homeY: FINAL_CENTER_Y,
    awayY: FINAL_CENTER_Y,
    midY: FINAL_CENTER_Y,
    columnX: columnCenterX(4),
    childMatches: [LEFT_SF[0], RIGHT_SF[0]],
  });

  return matches;
}

function connectChildToParent(
  child: BracketMatchGeometry,
  parent: BracketMatchGeometry
): string {
  const isLeft = child.side === "left";
  const xJunction = isLeft
    ? columnEdgeX(child.column, "right")
    : columnEdgeX(child.column, "left");

  return `M ${child.columnX} ${child.midY} H ${xJunction} V ${parent.midY} H ${parent.columnX}`;
}

function connectSemiToFinalSlot(
  semi: BracketMatchGeometry,
  slotX: number
): string {
  const isLeft = semi.side === "left";
  const xJunction = isLeft
    ? columnEdgeX(semi.column, "right")
    : columnEdgeX(semi.column, "left");

  return `M ${semi.columnX} ${semi.midY} H ${xJunction} V ${FINAL_CENTER_Y} H ${slotX}`;
}

export function buildBracketConnectorPaths(
  geoms: BracketMatchGeometry[]
): string[] {
  const byNumber = new Map(geoms.map((geom) => [geom.matchNumber, geom]));
  const paths: string[] = [];

  for (const geom of geoms) {
    if (geom.round === "final") continue;

    if (Math.abs(geom.homeY - geom.awayY) > 0.01) {
      paths.push(`M ${geom.columnX} ${geom.homeY} V ${geom.awayY}`);
    }

    if (!geom.childMatches) continue;

    for (const childNumber of geom.childMatches) {
      const child = byNumber.get(childNumber);
      if (child) paths.push(connectChildToParent(child, geom));
    }
  }

  const leftSemi = byNumber.get(LEFT_SF[0]);
  const rightSemi = byNumber.get(RIGHT_SF[0]);
  if (leftSemi) paths.push(connectSemiToFinalSlot(leftSemi, FINAL_HOME_X));
  if (rightSemi) paths.push(connectSemiToFinalSlot(rightSemi, FINAL_AWAY_X));

  return paths;
}

export function slotPosition(
  geom: BracketMatchGeometry,
  slot: "home" | "away"
): { x: number; y: number } {
  if (geom.round === "final") {
    return {
      x: slot === "home" ? FINAL_HOME_X : FINAL_AWAY_X,
      y: FINAL_CENTER_Y,
    };
  }

  return {
    x: geom.columnX,
    y: slot === "home" ? geom.homeY : geom.awayY,
  };
}

export function scorePosition(geom: BracketMatchGeometry): { x: number; y: number } {
  if (geom.round === "final") {
    return { x: 50, y: FINAL_CENTER_Y };
  }

  return { x: geom.columnX, y: geom.midY };
}
