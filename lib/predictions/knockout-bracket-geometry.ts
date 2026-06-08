import type { BracketRoundKey } from "@/lib/predictions/knockout-bracket-layout";

/**
 * Banda superior equivalente a la cabecera del calendario (mes + días de la semana).
 * Los dieciseisavos no deben invadir esta zona.
 */
export const BRACKET_HEADER_BAND_Y = 10;

/** Banda inferior del canvas reservada para el botón «Ver fase Prévia». */
export const BRACKET_FOOTER_BAND_Y = 10;

/** Margen extra bajo la cabecera para que la tarjeta no se recorte (translate -50%). */
const R32_TOP_CLEARANCE_Y = 2;

/** Ancla inferior: 1G vs 3º (M82) y 2D vs 2G (M88), alineados con el footer. */
export const R32_BOTTOM_ANCHOR_Y = 100 - BRACKET_FOOTER_BAND_Y / 2;

/** Primer dieciseisavos: justo debajo de la zona de cabecera. */
export const R32_TOP_ANCHOR_Y = BRACKET_HEADER_BAND_Y + R32_TOP_CLEARANCE_Y;

const R32_SLOT_COUNT = 8;
const R32_PAIR_HALF = 1.45;

export const FINAL_CENTER_X = 50;

/** Separación mínima entre el centro de semifinales y el de la final (% canvas). */
const MIN_FINAL_SEMI_GAP_Y = 12.5;

/** Copa flotante: distancia sobre el centro de la final (% canvas). */
export const FINAL_CUP_OFFSET_ABOVE_FINAL = 5.5;

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
export const BRACKET_SIDE_INSET = 5.25;

/** Empuje extra de dieciseisavos hacia el exterior (sin salir del viewport). */
const R32_EXTRA_OUTWARD_NUDGE = 1.35;

/** Margen mínimo al borde visible de pantalla (%). */
const R32_VISIBLE_EDGE_INSET = 3.5;

/** Ajuste fino de semifinales hacia el centro (positivo = acercar a la final). */
const NUDGE_SF_TOWARD_CENTER = 3.5;

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

function minCenterDistance(colA: number, colB: number): number {
  return (
    halfWidthForColumn(colA) +
    halfWidthForColumn(colB) +
    MIN_GAP_X * gapMultiplier(colA, colB)
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

  const minR32X = BRACKET_SIDE_INSET + halfWidthForColumn(0);
  const maxR32X = 100 - BRACKET_SIDE_INSET - halfWidthForColumn(8);

  const minSafeR32X = R32_VISIBLE_EDGE_INSET + halfWidthForColumn(0);
  const maxSafeR32X = 100 - R32_VISIBLE_EDGE_INSET - halfWidthForColumn(8);

  // Dieciseisavos hacia el exterior, con tope antes del borde no visible.
  x[0] = Math.max(minSafeR32X, minR32X - R32_EXTRA_OUTWARD_NUDGE);
  x[8] = Math.min(maxSafeR32X, maxR32X + R32_EXTRA_OUTWARD_NUDGE);

  // Semifinales más centradas; la final no se mueve.
  x[3] += NUDGE_SF_TOWARD_CENTER;
  x[5] -= NUDGE_SF_TOWARD_CENTER;

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

/** Octavos cuyo conector vertical no debe prolongarse hacia el borde de la página. */
const R16_CLIP_VERTICAL_TO_TOP = new Set([89, 91]);
const R16_CLIP_VERTICAL_TO_BOTTOM = new Set([94, 96]);
const RIGHT_QF = [99, 100] as const;
const RIGHT_SF = [102] as const;

function r32YFromSlot(slotIndex: number) {
  const t = slotIndex / (R32_SLOT_COUNT - 1);
  const midY = R32_TOP_ANCHOR_Y + t * (R32_BOTTOM_ANCHOR_Y - R32_TOP_ANCHOR_Y);
  return {
    midY,
    homeY: midY - R32_PAIR_HALF,
    awayY: midY + R32_PAIR_HALF,
  };
}

function findMatch(
  matches: BracketMatchGeometry[],
  matchNumber: number
): BracketMatchGeometry {
  const match = matches.find((entry) => entry.matchNumber === matchNumber);
  if (!match) {
    throw new Error(`Missing bracket match ${matchNumber}`);
  }
  return match;
}

function yFromChildPair(
  childA: BracketMatchGeometry,
  childB: BracketMatchGeometry
) {
  const top = childA.midY <= childB.midY ? childA : childB;
  const bottom = childA.midY <= childB.midY ? childB : childA;
  return {
    midY: (top.midY + bottom.midY) / 2,
    homeY: top.homeY,
    awayY: bottom.awayY,
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

function pushR32Side(
  out: BracketMatchGeometry[],
  matchNumbers: readonly number[],
  side: "left" | "right",
  column: number
) {
  matchNumbers.forEach((matchNumber, slotIndex) => {
    out.push({
      matchNumber,
      round: "r32",
      side,
      column,
      ...r32YFromSlot(slotIndex),
      columnX: mapColumnX(column),
      layoutScale: ROUND_LAYOUT_SCALE.r32,
    });
  });
}

function pushRoundFromChildren(
  out: BracketMatchGeometry[],
  matchNumbers: readonly number[],
  round: BracketRoundKey,
  side: "left" | "right",
  column: number,
  childGroups: readonly [number, number][]
) {
  matchNumbers.forEach((matchNumber, index) => {
    const [childANumber, childBNumber] = childGroups[index];
    const y = yFromChildPair(
      findMatch(out, childANumber),
      findMatch(out, childBNumber)
    );
    out.push({
      matchNumber,
      round,
      side,
      column,
      ...y,
      columnX: mapColumnX(column),
      layoutScale: ROUND_LAYOUT_SCALE[round],
      childMatches: [childANumber, childBNumber],
    });
  });
}

export function buildBracketGeometry(): BracketMatchGeometry[] {
  const matches: BracketMatchGeometry[] = [];

  pushR32Side(matches, LEFT_R32, "left", 0);
  pushR32Side(matches, RIGHT_R32, "right", 8);

  pushRoundFromChildren(matches, LEFT_R16, "r16", "left", 1, [
    [LEFT_R32[0], LEFT_R32[1]],
    [LEFT_R32[2], LEFT_R32[3]],
    [LEFT_R32[4], LEFT_R32[5]],
    [LEFT_R32[6], LEFT_R32[7]],
  ]);
  pushRoundFromChildren(matches, LEFT_QF, "qf", "left", 2, [
    [LEFT_R16[0], LEFT_R16[1]],
    [LEFT_R16[2], LEFT_R16[3]],
  ]);
  pushRoundFromChildren(matches, LEFT_SF, "sf", "left", 3, [[LEFT_QF[0], LEFT_QF[1]]]);

  pushRoundFromChildren(matches, RIGHT_R16, "r16", "right", 7, [
    [RIGHT_R32[0], RIGHT_R32[1]],
    [RIGHT_R32[2], RIGHT_R32[3]],
    [RIGHT_R32[4], RIGHT_R32[5]],
    [RIGHT_R32[6], RIGHT_R32[7]],
  ]);
  pushRoundFromChildren(matches, RIGHT_QF, "qf", "right", 6, [
    [RIGHT_R16[0], RIGHT_R16[1]],
    [RIGHT_R16[2], RIGHT_R16[3]],
  ]);
  pushRoundFromChildren(matches, RIGHT_SF, "sf", "right", 5, [[RIGHT_QF[0], RIGHT_QF[1]]]);

  const semiMidY = findMatch(matches, LEFT_SF[0]).midY;
  const finalCenterY = semiMidY - MIN_FINAL_SEMI_GAP_Y;

  matches.push({
    matchNumber: 104,
    round: "final",
    side: "center",
    column: 4,
    homeY: finalCenterY,
    awayY: finalCenterY,
    midY: finalCenterY,
    columnX: FINAL_CENTER_X,
    layoutScale: ROUND_LAYOUT_SCALE.final,
    childMatches: [LEFT_SF[0], RIGHT_SF[0]],
  });

  return matches;
}

export function finalCenterYFromGeometry(
  geoms: readonly BracketMatchGeometry[]
): number {
  return geoms.find((geom) => geom.round === "final")?.midY ?? 50;
}

function verticalAnchorY(
  child: BracketMatchGeometry,
  parent: BracketMatchGeometry
): number {
  if (parent.round !== "r16") return parent.midY;

  const childAbove = child.midY < parent.midY;

  if (R16_CLIP_VERTICAL_TO_TOP.has(parent.matchNumber)) {
    return childAbove ? parent.homeY : parent.midY;
  }

  if (R16_CLIP_VERTICAL_TO_BOTTOM.has(parent.matchNumber)) {
    return childAbove ? parent.midY : parent.awayY;
  }

  return parent.midY;
}

function connectChildToParent(
  child: BracketMatchGeometry,
  parent: BracketMatchGeometry
): string {
  const isLeft = child.side === "left";
  const xVertical =
    parent.round === "sf"
      ? parent.columnX
      : gutterX(Math.min(child.column, parent.column), Math.max(child.column, parent.column));
  const xStart = cardEdgeX(child.columnX, isLeft ? "right" : "left", child.layoutScale);
  const xEnd = cardEdgeX(parent.columnX, isLeft ? "left" : "right", parent.layoutScale);
  const yAnchor = verticalAnchorY(child, parent);

  return `M ${xStart} ${child.midY} H ${xVertical} V ${yAnchor} H ${xEnd}`;
}

function connectSemiToFinal(
  semi: BracketMatchGeometry,
  anchorX: number,
  finalCenterY: number
): string {
  const isLeft = semi.side === "left";
  const xStart = cardEdgeX(semi.columnX, isLeft ? "right" : "left", semi.layoutScale);

  return `M ${xStart} ${semi.midY} H ${semi.columnX} V ${finalCenterY} H ${anchorX}`;
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

    if (
      Math.abs(geom.homeY - geom.awayY) > 0.01 &&
      geom.round !== "r16" &&
      geom.round !== "qf"
    ) {
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

  const finalCenterY = finalCenterYFromGeometry(geoms);
  const leftSemi = byNumber.get(LEFT_SF[0]);
  const rightSemi = byNumber.get(RIGHT_SF[0]);
  if (leftSemi) {
    segments.push({
      d: connectSemiToFinal(leftSemi, FINAL_ANCHOR_LEFT_X, finalCenterY),
      variant: "final",
    });
  }
  if (rightSemi) {
    segments.push({
      d: connectSemiToFinal(rightSemi, FINAL_ANCHOR_RIGHT_X, finalCenterY),
      variant: "final",
    });
  }

  return segments;
}

export function matchPosition(geom: BracketMatchGeometry): { x: number; y: number } {
  return { x: geom.columnX, y: geom.midY };
}
