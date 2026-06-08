import type { BracketRoundKey } from "@/lib/predictions/knockout-bracket-layout";

export const BRACKET_LEAF_SLOTS = 16;
export const BRACKET_VERTICAL_PAD = 3;
export const BRACKET_VERTICAL_COMPACT = 0.88;

/** Posiciones X uniformes (9 columnas, márgenes laterales amplios). */
export const COLUMN_X_BY_INDEX: readonly number[] = [9, 19, 29, 41, 50, 59, 71, 81, 91];

export const FINAL_CENTER_X = 50;
export const FINAL_CENTER_Y = 50;
export const FINAL_ANCHOR_LEFT_X = 44;
export const FINAL_ANCHOR_RIGHT_X = 56;

/** Escalado visual por ronda. */
export const ROUND_LAYOUT_SCALE: Record<BracketRoundKey, number> = {
  r32: 1,
  r16: 1.1,
  qf: 1.2,
  sf: 1.3,
  final: 1.5,
};

/** Ancho aproximado de media tarjeta (% canvas) para anclar conectores. */
export const CARD_HALF_WIDTH_BASE = 4.2;

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

export function compactY(y: number): number {
  return 50 + (y - 50) * BRACKET_VERTICAL_COMPACT;
}

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

export function mapColumnX(column: number): number {
  return COLUMN_X_BY_INDEX[column] ?? 50;
}

export function gutterX(columnA: number, columnB: number): number {
  return (mapColumnX(columnA) + mapColumnX(columnB)) / 2;
}

export function cardEdgeX(
  columnX: number,
  edge: "left" | "right",
  layoutScale: number
): number {
  const half = CARD_HALF_WIDTH_BASE * layoutScale;
  return edge === "left" ? columnX - half : columnX + half;
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
    columnX: FINAL_CENTER_X,
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
  const xGutter = gutterX(
    Math.min(child.column, parent.column),
    Math.max(child.column, parent.column)
  );
  const xStart = cardEdgeX(child.columnX, isLeft ? "right" : "left", child.layoutScale);
  const xEnd = cardEdgeX(parent.columnX, isLeft ? "left" : "right", parent.layoutScale);

  return `M ${xStart} ${child.midY} H ${xGutter} V ${parent.midY} H ${xEnd}`;
}

function connectSemiToFinal(
  semi: BracketMatchGeometry,
  anchorX: number
): string {
  const isLeft = semi.side === "left";
  const xStart = cardEdgeX(semi.columnX, isLeft ? "right" : "left", semi.layoutScale);
  const xGutter = gutterX(isLeft ? semi.column : 4, isLeft ? 4 : semi.column);

  return `M ${xStart} ${semi.midY} H ${xGutter} V ${FINAL_CENTER_Y} H ${anchorX}`;
}

export function buildBracketConnectorPaths(
  geoms: BracketMatchGeometry[]
): string[] {
  const byNumber = new Map(geoms.map((geom) => [geom.matchNumber, geom]));
  const paths: string[] = [];

  for (const geom of geoms) {
    if (geom.round === "final" || !geom.childMatches) continue;

    for (const childNumber of geom.childMatches) {
      const child = byNumber.get(childNumber);
      if (child) paths.push(connectChildToParent(child, geom));
    }
  }

  const leftSemi = byNumber.get(LEFT_SF[0]);
  const rightSemi = byNumber.get(RIGHT_SF[0]);
  if (leftSemi) paths.push(connectSemiToFinal(leftSemi, FINAL_ANCHOR_LEFT_X));
  if (rightSemi) paths.push(connectSemiToFinal(rightSemi, FINAL_ANCHOR_RIGHT_X));

  return paths;
}

export function matchPosition(geom: BracketMatchGeometry): { x: number; y: number } {
  return { x: geom.columnX, y: geom.midY };
}
