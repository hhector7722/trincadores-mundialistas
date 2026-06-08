import type { FieldCoordinate, LineupSlot } from "@/lib/lineup/types";

/**
 * Proyección proporcional del modal de alineación (position-map, y: 16→90)
 * al campo compartido MVP con perspectiva Goya.
 *
 * Cada equipo ocupa su mitad manteniendo la misma distribución relativa de líneas
 * (FW → MF → DF → GK) que en el modal de un solo equipo.
 */

/** Rango táctico del modal de alineación (position-map). */
const LINEUP_ATTACK_Y = 16;
const LINEUP_DEFENSE_Y = 90;

/** Línea de medio campo en la imagen Goya (%). */
const MIDFIELD_Y = 50;

/** Margen entre líneas de ataque y el centro (hueco entre equipos). */
const MIDFIELD_GAP = 6;

/** Local: delanteros cerca del centro, portería abajo. */
const HOME_ATTACK_Y = MIDFIELD_Y + MIDFIELD_GAP;
const HOME_DEFENSE_Y = 90;

/** Visitante: delanteros cerca del centro, portería arriba. */
const AWAY_BLOCK_SHIFT_Y = -5;
const AWAY_ATTACK_Y = MIDFIELD_Y - MIDFIELD_GAP + AWAY_BLOCK_SHIFT_Y;
const AWAY_DEFENSE_Y = 10 + AWAY_BLOCK_SHIFT_Y;

const GOYA_PITCH_TOP_Y = 8;
const GOYA_PITCH_BOTTOM_Y = 92;

/** Compresión horizontal del trapezoide Goya (arriba más estrecho). */
const GOYA_WIDTH_TOP = 0.7;
const GOYA_WIDTH_BOTTOM = 1;

/** Escala visual según profundidad (visitante arriba = más pequeño). */
const GOYA_SCALE_TOP = 0.74;
const GOYA_SCALE_BOTTOM = 1;

export type MatchFieldSlot = LineupSlot & { scale: number };

function lineupDepth(y: number): number {
  return (y - LINEUP_ATTACK_Y) / (LINEUP_DEFENSE_Y - LINEUP_ATTACK_Y);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function pitchDepth(y: number): number {
  return clamp01((y - GOYA_PITCH_TOP_Y) / (GOYA_PITCH_BOTTOM_Y - GOYA_PITCH_TOP_Y));
}

/** Misma proporción vertical que el modal, comprimida en la mitad inferior. */
function mapToHomeHalf(coord: FieldCoordinate): FieldCoordinate {
  const depth = lineupDepth(coord.y);
  return {
    x: coord.x,
    y: HOME_ATTACK_Y + depth * (HOME_DEFENSE_Y - HOME_ATTACK_Y),
  };
}

/** Misma proporción vertical que el modal, comprimida en la mitad superior. */
function mapToAwayHalf(coord: FieldCoordinate): FieldCoordinate {
  const depth = lineupDepth(coord.y);
  return {
    x: coord.x,
    y: AWAY_ATTACK_Y - depth * (AWAY_ATTACK_Y - AWAY_DEFENSE_Y),
  };
}

export function goyaWidthFactor(y: number): number {
  const t = pitchDepth(y);
  return GOYA_WIDTH_TOP + t * (GOYA_WIDTH_BOTTOM - GOYA_WIDTH_TOP);
}

export function goyaScaleFactor(y: number): number {
  const t = pitchDepth(y);
  return GOYA_SCALE_TOP + t * (GOYA_SCALE_BOTTOM - GOYA_SCALE_TOP);
}

export function applyGoyaPerspective(slot: LineupSlot): MatchFieldSlot {
  const width = goyaWidthFactor(slot.y);
  const scale = goyaScaleFactor(slot.y);
  return {
    ...slot,
    x: 50 + (slot.x - 50) * width,
    scale,
  };
}

export function mapSlotsToHomeHalf(slots: LineupSlot[]): MatchFieldSlot[] {
  return slots.map((slot) => applyGoyaPerspective({ ...slot, ...mapToHomeHalf(slot) }));
}

export function mapSlotsToAwayHalf(slots: LineupSlot[]): MatchFieldSlot[] {
  return slots.map((slot) => applyGoyaPerspective({ ...slot, ...mapToAwayHalf(slot) }));
}
