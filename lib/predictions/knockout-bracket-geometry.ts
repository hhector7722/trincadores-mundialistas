import type { BracketRoundKey } from "@/lib/predictions/knockout-bracket-layout";

export const BRACKET_COLUMN_COUNT = 9;
export const BRACKET_LEAF_SLOTS = 16;

/** Margen lateral para dieciseisavos (% del ancho del canvas). */
export const BRACKET_HORIZONTAL_INSET = 4.5;
/** Acercamiento de semis/final al centro (0.35 ≈ −35 % de hueco). */
export const BRACKET_CENTER_PULL = 0.35;
/** Compactación vertical del árbol hacia Y=50 (0.83 ≈ −17 % de altura). */
export const BRACKET_VERTICAL_COMPACT = 0.83;
export const BRACKET_VERTICAL_PAD = 2.5;

export const FINAL_HOME_X = 45.5;
export const FINAL_AWAY_X = 54.5;
export const FINAL_CENTER_Y = 50;

/** Escalado de layout por ronda (solo transform, sin cambiar estilos base). */
export const ROUND_LAYOUT_SCALE: Record<BracketRoundKey, number> = {
  r32: 1,
  r16: 1.05,
  qf: 1.1,
  sf: 1.15,
  final: 1.4,
};

export const CHAMPION_LAYOUT_SCALE = 1.7;

export function compactY(y: number): number {
  return 50 + (y - 50) * BRACKET_VERTICAL_COMPACT;
}

export const CHAMPION_X = 50;
export const CHAMPION_Y = compactY(61.5);

export type BracketMatchGeometry = {
  matchNumber: number;
  round: BracketRoundKey;
  side: "left" | "right" | "center";
  column: number;
  homeY: number;
  awayY: number;
  midY: number;
  columnX: number;
  layoutScale: number;
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
  return compactY(BRACKET_VERTICAL_PAD + (raw / 100) * usable);
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

function centerPullFactor(column: number): number {
  if (column === 4) return 0;
  const dist = Math.abs(column - 4);
  if (dist === 1) return BRACKET_CENTER_PULL;
  if (dist === 2) return BRACKET_CENTER_PULL * 0.55;
  if (dist === 3) return BRACKET_CENTER_PULL * 0.3;
  return 0;
}

export function mapColumnX(column: number): number {
  const rawCenter = ((column + 0.5) / BRACKET_COLUMN_COUNT) * 100;
  const pull = centerPullFactor(column);
  let mapped = 50 + (rawCenter - 50) * (1 - pull);

  if (column === 0) {
    mapped = Math.max(BRACKET_HORIZONTAL_INSET + 2.8, mapped);
  }
  if (column === 8) {
    mapped = Math.min(100 - BRACKET_HORIZONTAL_INSET - 2.8, mapped);
  }

  return mapped;
}

export function columnEdgeX(column: number, edge: "left" | "right"): number {
  const center = mapColumnX(column);
  const halfWidth = (100 / BRACKET_COLUMN_COUNT) * (1 - centerPullFactor(column) * 0.5) * 0.5;
  return edge === "left" ? center - halfWidth * 0.85 : center + halfWidth * 0.85;
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
      columnX: mapColumnX(column),
      layoutScale: ROUND_LAYOUT_SCALE[round],
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
    columnX: mapColumnX(4),
    layoutScale: ROUND_LAYOUT_SCALE.final,
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
  slotX: number,
  slotY: number
): string {
  const isLeft = semi.side === "left";
  const xJunction = isLeft
    ? columnEdgeX(semi.column, "right")
    : columnEdgeX(semi.column, "left");

  return `M ${semi.columnX} ${semi.midY} H ${xJunction} V ${slotY} H ${slotX}`;
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
  if (leftSemi) {
    paths.push(connectSemiToFinalSlot(leftSemi, FINAL_HOME_X, FINAL_CENTER_Y));
  }
  if (rightSemi) {
    paths.push(connectSemiToFinalSlot(rightSemi, FINAL_AWAY_X, FINAL_CENTER_Y));
  }

  paths.push(`M 50 ${FINAL_CENTER_Y} V ${CHAMPION_Y}`);

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

export function championPosition(): { x: number; y: number } {
  return { x: CHAMPION_X, y: CHAMPION_Y };
}
