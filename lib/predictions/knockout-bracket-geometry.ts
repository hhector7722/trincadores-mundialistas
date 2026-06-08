import type { BracketRoundKey } from "@/lib/predictions/knockout-bracket-layout";

export const BRACKET_LEAF_SLOTS = 16;
export const BRACKET_VERTICAL_PAD = 2;
export const BRACKET_VERTICAL_COMPACT = 0.95;

export const FINAL_CENTER_X = 50;
export const FINAL_CENTER_Y = 50;

/** Escalado visual por ronda (progresión suave). */
export const ROUND_LAYOUT_SCALE: Record<BracketRoundKey, number> = {
  r32: 1,
  r16: 1.08,
  qf: 1.16,
  sf: 1.25,
  final: 1.35,
};

/** Ancho aproximado de media tarjeta (% canvas) para anclar conectores. */
export const CARD_HALF_WIDTH_BASE = 4.2;

/**
 * Separación mínima horizontal entre tarjetas (en % del canvas 0–100).
 * Ajustable: 24px aprox en móvil suele rondar ~6–7% del ancho.
 */
export const MIN_GAP_X = 5.5;

/** Separación mínima vertical (en % del canvas). */
export const MIN_GAP_Y = 3;

/** Margen lateral para dieciseisavos (en % del canvas). */
export const BRACKET_SIDE_INSET = 6.5;

const COLUMN_SCALE_BY_INDEX: readonly number[] = [
  ROUND_LAYOUT_SCALE.r32, // 0
  ROUND_LAYOUT_SCALE.r16, // 1
  ROUND_LAYOUT_SCALE.qf, // 2
  ROUND_LAYOUT_SCALE.sf, // 3
  ROUND_LAYOUT_SCALE.final, // 4
  ROUND_LAYOUT_SCALE.sf, // 5
  ROUND_LAYOUT_SCALE.qf, // 6
  ROUND_LAYOUT_SCALE.r16, // 7
  ROUND_LAYOUT_SCALE.r32, // 8
];

function halfWidthForColumn(column: number): number {
  const scale = COLUMN_SCALE_BY_INDEX[column] ?? 1;
  return CARD_HALF_WIDTH_BASE * scale;
}

/** Acerca columnas interiores ~15–20 % (octavos→final). */
function gapMultiplier(colA: number, colB: number): number {
  const minCol = Math.min(colA, colB);
  const maxCol = Math.max(colA, colB);
  const distFromCenter = Math.min(Math.abs(minCol - 4), Math.abs(maxCol - 4));
  if (distFromCenter <= 1) return 0.8;
  if (distFromCenter === 2) return 0.86;
  return 0.92;
}

/**
 * Aire extra entre pares concretos (% del canvas; ~26–28px en móvil estrecho).
 * Solo dieciseisavos↔octavos y semifinales↔final.
 */
function extraGapForPair(colA: number, colB: number): number {
  const minCol = Math.min(colA, colB);
  const maxCol = Math.max(colA, colB);
  if (minCol === 0 && maxCol === 1) return 7;
  if (minCol === 3 && maxCol === 4) return 6.5;
  return 0;
}

function minCenterDistance(colA: number, colB: number): number {
  return (
    halfWidthForColumn(colA) +
    halfWidthForColumn(colB) +
    MIN_GAP_X * gapMultiplier(colA, colB) +
    extraGapForPair(colA, colB)
  );
}

/**
 * Calcula las X de las 9 columnas garantizando que:
 * - La final tiene su propia columna física (col 4).
 * - Hay zona central y distancia mínima entre columnas adyacentes (sin solapes).
 * - Simetría perfecta izquierda/derecha.
 */
export function buildColumnCenters(): readonly number[] {
  const x: number[] = Array(9).fill(50);
  x[4] = FINAL_CENTER_X;

  // Construcción desde el centro hacia fuera (garantiza hueco entre rondas).
  for (let step = 1; step <= 4; step++) {
    const left = 4 - step;
    const right = 4 + step;
    const prevLeft = left + 1;
    const prevRight = right - 1;
    x[left] = x[prevLeft] - minCenterDistance(left, prevLeft);
    x[right] = x[prevRight] + minCenterDistance(right, prevRight);
  }

  // Clamp a márgenes laterales manteniendo simetría (si fuese necesario).
  const minX = BRACKET_SIDE_INSET + halfWidthForColumn(0);
  const maxX = 100 - BRACKET_SIDE_INSET - halfWidthForColumn(8);
  const overflowLeft = minX - x[0];
  const overflowRight = x[8] - maxX;

  const shift = Math.max(0, overflowLeft, overflowRight);
  if (shift > 0) {
    // Reducimos expansión desde el centro (escala horizontal global).
    const leftSpan = FINAL_CENTER_X - minX;
    const rightSpan = maxX - FINAL_CENTER_X;
    const maxSpan = Math.min(leftSpan, rightSpan);
    const currentSpan = Math.max(FINAL_CENTER_X - x[0], x[8] - FINAL_CENTER_X);
    const factor = currentSpan > 0 ? Math.max(0.72, maxSpan / currentSpan) : 1;

    for (let i = 0; i < 9; i++) {
      x[i] = FINAL_CENTER_X + (x[i] - FINAL_CENTER_X) * factor;
    }
  }

  return x;
}

const COLUMN_CENTERS = buildColumnCenters();

export const FINAL_ANCHOR_LEFT_X = FINAL_CENTER_X - halfWidthForColumn(4);
export const FINAL_ANCHOR_RIGHT_X = FINAL_CENTER_X + halfWidthForColumn(4);

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
  return COLUMN_CENTERS[column] ?? 50;
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

export type BracketConnectorSegment = {
  d: string;
  variant: "default" | "pair" | "final";
};

export function buildBracketConnectorPaths(
  geoms: BracketMatchGeometry[]
): BracketConnectorSegment[] {
  const byNumber = new Map(geoms.map((geom) => [geom.matchNumber, geom]));
  const segments: BracketConnectorSegment[] = [];

  for (const geom of geoms) {
    if (geom.round === "final") continue;

    if (Math.abs(geom.homeY - geom.awayY) > 0.01) {
      segments.push({
        d: `M ${geom.columnX} ${geom.homeY} V ${geom.awayY}`,
        variant: geom.round === "r32" ? "pair" : "default",
      });
    }

    if (!geom.childMatches) continue;

    for (const childNumber of geom.childMatches) {
      const child = byNumber.get(childNumber);
      if (child) {
        segments.push({
          d: connectChildToParent(child, geom),
          variant: "default",
        });
      }
    }
  }

  const leftSemi = byNumber.get(LEFT_SF[0]);
  const rightSemi = byNumber.get(RIGHT_SF[0]);
  if (leftSemi) {
    segments.push({
      d: connectSemiToFinal(leftSemi, FINAL_ANCHOR_LEFT_X),
      variant: "final",
    });
  }
  if (rightSemi) {
    segments.push({
      d: connectSemiToFinal(rightSemi, FINAL_ANCHOR_RIGHT_X),
      variant: "final",
    });
  }

  return segments;
}

export function matchPosition(geom: BracketMatchGeometry): { x: number; y: number } {
  return { x: geom.columnX, y: geom.midY };
}
