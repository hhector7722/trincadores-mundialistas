import type { BracketRoundKey } from "@/lib/predictions/knockout-bracket-layout";

/**
 * Rejilla guía (no visible en UI): 10 columnas A–J × 15 filas.
 * Las posiciones del cuadro se derivan de esta malla; no se dibujan líneas.
 *
 * Columnas: A(r32) B(r16) C(qf) D(sf) E(finalista) | F(finalista) G(sf) H(qf) I(r16) J(r32)
 * Filas por ronda (centro del enfrentamiento): r32 → 1,3,…,15 · r16 → 2,6,10,14 · qf → 4,12 · sf/final → 8
 */

/** Columnas de la rejilla guía (A=0 … J=9). */
export const BRACKET_GRID_COLS = 10;

/** Filas de la rejilla guía (1 … 15). */
export const BRACKET_GRID_ROWS = 15;

/** Columna A — dieciseisavos izquierda. */
export const COL_R32_LEFT = 0;
/** Columna E — local de la final / finalista izquierda. */
export const COL_FINAL_HOME = 4;
/** Columna F — visitante de la final / finalista derecha. */
export const COL_FINAL_AWAY = 5;
/** Columna J — dieciseisavos derecha. */
export const COL_R32_RIGHT = 9;

/**
 * Banda superior reducida al mínimo.
 */
export const BRACKET_HEADER_BAND_Y = 4;

/** Banda inferior del canvas reservada para el botón «Ver fase Prévia». */
export const BRACKET_FOOTER_BAND_Y = 12;

/** Margen extra bajo la cabecera para que la tarjeta no se recorte (translate -50%). */
const R32_TOP_CLEARANCE_Y = 4;

/** Ancla inferior: fila 15 de la rejilla guía. */
export const R32_BOTTOM_ANCHOR_Y = 100 - BRACKET_FOOTER_BAND_Y / 2;

/** Ancla superior: fila 1 de la rejilla guía. */
export const R32_TOP_ANCHOR_Y = BRACKET_HEADER_BAND_Y + R32_TOP_CLEARANCE_Y;

/** Escala global de tarjetas con equipos (ancho + alto proporcional). */
export const KO_CARD_SIZE_SCALE = 0.92;

/** Radio vertical aproximado del orbe (% canvas Y). */
const ORB_HALF_Y = 1.3;

/** Holgura mínima entre bordes de dos orbes del mismo enfrentamiento (% canvas Y). */
const ORB_INNER_EDGE_GAP_Y = 4.8;

/** Mitad de la separación centro-a-centro dentro de un enfrentamiento (% canvas Y). */
export const ORB_PAIR_INNER_HALF_Y = ORB_HALF_Y + ORB_INNER_EDGE_GAP_Y / 2;

/** @deprecated Usar ORB_PAIR_INNER_HALF_Y */
export const R32_PAIR_INNER_HALF_Y = ORB_PAIR_INNER_HALF_Y;

/** Índice de ronda en la rejilla guía: 0=r32, 1=r16, 2=qf, 3=sf. */
export type BracketGridRoundIndex = 0 | 1 | 2 | 3;

const ROUND_TO_GRID_INDEX: Record<Exclude<BracketRoundKey, "final">, BracketGridRoundIndex> =
  {
    r32: 0,
    r16: 1,
    qf: 2,
    sf: 3,
  };

/** Fila 1-indexed del centro de un slot en la rejilla guía. */
export function bracketGridRowCenter(
  roundIndex: BracketGridRoundIndex,
  slotIndex: number
): number {
  return 2 ** roundIndex + slotIndex * 2 ** (roundIndex + 1);
}

/** Convierte fila de rejilla (1…15) a coordenada Y del canvas (%). */
export function gridRowToPercentY(row1Based: number): number {
  const t = (row1Based - 1) / (BRACKET_GRID_ROWS - 1);
  return R32_TOP_ANCHOR_Y + t * (R32_BOTTOM_ANCHOR_Y - R32_TOP_ANCHOR_Y);
}

function yFromGridRow(row1Based: number) {
  const midY = gridRowToPercentY(row1Based);
  return yFromPairCenter(midY);
}

function yFromPairCenter(midY: number) {
  return {
    midY,
    homeY: midY - ORB_PAIR_INNER_HALF_Y,
    awayY: midY + ORB_PAIR_INNER_HALF_Y,
  };
}

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
export const CARD_HALF_WIDTH_BASE = 4.2 * KO_CARD_SIZE_SCALE;

/** Mitad del orbe en X (% canvas) para anclar líneas conectoras. */
export const ORB_HALF_WIDTH_X = 2.65 * KO_CARD_SIZE_SCALE;

/** Margen lateral homogéneo para las columnas del cuadro (% canvas). */
export const BRACKET_COLUMN_INSET = 3.5;

const COLUMN_SCALE_BY_INDEX: readonly number[] = [
  ROUND_LAYOUT_SCALE.r32, // A — 0
  ROUND_LAYOUT_SCALE.r16, // B — 1
  ROUND_LAYOUT_SCALE.qf, // C — 2
  ROUND_LAYOUT_SCALE.sf, // D — 3
  ROUND_LAYOUT_SCALE.final, // E — 4
  ROUND_LAYOUT_SCALE.final, // F — 5
  ROUND_LAYOUT_SCALE.sf, // G — 6
  ROUND_LAYOUT_SCALE.qf, // H — 7
  ROUND_LAYOUT_SCALE.r16, // I — 8
  ROUND_LAYOUT_SCALE.r32, // J — 9
];

function halfWidthForColumn(column: number): number {
  const scale = COLUMN_SCALE_BY_INDEX[column] ?? 1;
  return CARD_HALF_WIDTH_BASE * scale;
}

/** Centros X de las 10 columnas guía A…J (% canvas). */
export function buildColumnCenters(): readonly number[] {
  const span = 100 - 2 * BRACKET_COLUMN_INSET;
  return Array.from(
    { length: BRACKET_GRID_COLS },
    (_, index) => BRACKET_COLUMN_INSET + (span * (index + 0.5)) / BRACKET_GRID_COLS
  );
}

const COLUMN_CENTERS = buildColumnCenters();

export function mapColumnX(column: number): number {
  return COLUMN_CENTERS[column] ?? 50;
}

/** Centro horizontal entre columnas E y F (copa + eje de la final). */
export const FINAL_CENTER_X =
  (mapColumnX(COL_FINAL_HOME) + mapColumnX(COL_FINAL_AWAY)) / 2;

export const FINAL_ANCHOR_LEFT_X = mapColumnX(COL_FINAL_HOME);
export const FINAL_ANCHOR_RIGHT_X = mapColumnX(COL_FINAL_AWAY);

export type BracketMatchGeometry = {
  matchNumber: number;
  round: BracketRoundKey;
  side: "left" | "right" | "center";
  /** Columna guía principal (0…9). */
  column: number;
  homeY: number;
  awayY: number;
  midY: number;
  columnX: number;
  /** Si difiere de columnX (p. ej. final en E vs F). */
  homeX?: number;
  awayX?: number;
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

const FINAL_GRID_ROW = bracketGridRowCenter(3, 0);

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

export function connectorEdgeX(
  columnX: number,
  edge: "left" | "right",
  layoutScale: number
): number {
  const half = ORB_HALF_WIDTH_X * Math.min(layoutScale, 1.12);
  return edge === "left" ? columnX - half : columnX + half;
}

function pushR32Side(
  out: BracketMatchGeometry[],
  matchNumbers: readonly number[],
  side: "left" | "right",
  column: number
) {
  matchNumbers.forEach((matchNumber, slotIndex) => {
    const row = bracketGridRowCenter(0, slotIndex);
    const { midY } = yFromGridRow(row);
    const columnX = mapColumnX(column);
    const offsetX = 3.8;
    
    out.push({
      matchNumber,
      round: "r32",
      side,
      column,
      midY,
      homeY: midY,
      awayY: midY,
      homeX: side === "left" ? columnX - offsetX : columnX + offsetX,
      awayX: side === "left" ? columnX + offsetX : columnX - offsetX,
      columnX,
      layoutScale: ROUND_LAYOUT_SCALE.r32,
    });
  });
}

function pushRoundFromChildren(
  out: BracketMatchGeometry[],
  matchNumbers: readonly number[],
  round: Exclude<BracketRoundKey, "final">,
  side: "left" | "right",
  column: number,
  childGroups: readonly [number, number][]
) {
  const roundIndex = ROUND_TO_GRID_INDEX[round];

  matchNumbers.forEach((matchNumber, index) => {
    const [childANumber, childBNumber] = childGroups[index];
    const row = bracketGridRowCenter(roundIndex, index);
    out.push({
      matchNumber,
      round,
      side,
      column,
      ...yFromGridRow(row),
      columnX: mapColumnX(column),
      layoutScale: ROUND_LAYOUT_SCALE[round],
      childMatches: [childANumber, childBNumber],
    });
  });
}

export function buildBracketGeometry(): BracketMatchGeometry[] {
  const matches: BracketMatchGeometry[] = [];

  pushR32Side(matches, LEFT_R32, "left", COL_R32_LEFT);
  pushR32Side(matches, RIGHT_R32, "right", COL_R32_RIGHT);

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

  pushRoundFromChildren(matches, RIGHT_R16, "r16", "right", 8, [
    [RIGHT_R32[0], RIGHT_R32[1]],
    [RIGHT_R32[2], RIGHT_R32[3]],
    [RIGHT_R32[4], RIGHT_R32[5]],
    [RIGHT_R32[6], RIGHT_R32[7]],
  ]);
  pushRoundFromChildren(matches, RIGHT_QF, "qf", "right", 7, [
    [RIGHT_R16[0], RIGHT_R16[1]],
    [RIGHT_R16[2], RIGHT_R16[3]],
  ]);
  pushRoundFromChildren(matches, RIGHT_SF, "sf", "right", 6, [[RIGHT_QF[0], RIGHT_QF[1]]]);

  const homeX = mapColumnX(COL_FINAL_HOME);
  const awayX = mapColumnX(COL_FINAL_AWAY);
  const finalMidY = gridRowToPercentY(FINAL_GRID_ROW);

  matches.push({
    matchNumber: 104,
    round: "final",
    side: "center",
    column: COL_FINAL_HOME,
    midY: finalMidY,
    homeY: finalMidY,
    awayY: finalMidY,
    homeX,
    awayX,
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

/** @deprecated La rejilla guía fija las filas; conservado por compatibilidad de tests. */
export function buildPairCentersInBand(matchCount: number): readonly number[] {
  if (matchCount <= 0) return [];
  if (matchCount === 1) return [gridRowToPercentY(FINAL_GRID_ROW)];

  const roundIndex = Math.round(Math.log2(8 / matchCount)) as BracketGridRoundIndex;
  return Array.from({ length: matchCount }, (_, index) =>
    gridRowToPercentY(bracketGridRowCenter(roundIndex, index))
  );
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
  const xStart = connectorEdgeX(child.columnX, isLeft ? "right" : "left", child.layoutScale);
  const xEnd = connectorEdgeX(parent.columnX, isLeft ? "left" : "right", parent.layoutScale);

  return `M ${xStart} ${child.midY} H ${xVertical} V ${parent.midY} H ${xEnd}`;
}

function connectSemiToFinal(
  semi: BracketMatchGeometry,
  anchorX: number,
  finalCenterY: number
): string {
  const isLeft = semi.side === "left";
  const xStart = connectorEdgeX(semi.columnX, isLeft ? "right" : "left", semi.layoutScale);

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

    if (Math.abs(geom.homeY - geom.awayY) > 0.01) {
      segments.push({
        d: `M ${geom.columnX} ${geom.homeY} V ${geom.awayY}`,
        variant: "pair",
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

  const final = byNumber.get(104);
  if (final?.homeX != null && final.awayX != null) {
    const homeEdge = connectorEdgeX(final.homeX, "right", final.layoutScale);
    const awayEdge = connectorEdgeX(final.awayX, "left", final.layoutScale);
    if (Math.abs(homeEdge - awayEdge) > 0.05) {
      segments.push({
        d: `M ${homeEdge} ${final.midY} H ${awayEdge}`,
        variant: "final",
      });
    }
  }

  return segments;
}

export function matchPosition(geom: BracketMatchGeometry): { x: number; y: number } {
  return { x: geom.columnX, y: geom.midY };
}

/** Ancho del área táctil de la final entre columnas E y F (% canvas). */
export function finalHitSpanPercent(): number {
  return Math.abs(mapColumnX(COL_FINAL_AWAY) - mapColumnX(COL_FINAL_HOME)) + 4;
}
