import type { FieldCoordinate, LineupSlot } from "@/lib/lineup/types";

/**
 * Geometría del MVP en campo compartido.
 * Parte de las coordenadas del modal de alineación (campo completo, y: 16 ataque → 90 portería)
 * y las proyecta a cada mitad con perspectiva Goya (estrecho arriba, ancho abajo).
 */

const SINGLE_ATTACK_Y = 16;
const SINGLE_DEFENSE_Y = 90;

/** Mitad inferior (local): portería abajo, ataque hacia el centro. */
const HOME_ATTACK_Y = 57;
const HOME_DEFENSE_Y = 91;

/** Mitad superior (visitante): portería arriba, ataque hacia el centro. */
const AWAY_ATTACK_Y = 43;
const AWAY_DEFENSE_Y = 9;

/** Límites verticales del plano de juego en la imagen Goya (%). */
const GOYA_PITCH_TOP_Y = 8;
const GOYA_PITCH_BOTTOM_Y = 92;

/** Compresión horizontal en el fondo del plano (arriba del campo). */
const GOYA_WIDTH_FACTOR_TOP = 0.68;
const GOYA_WIDTH_FACTOR_BOTTOM = 1;

/**
 * Escala visual mínima en la parte alta: un poco por encima del ancho del plano
 * para que dorsales y nombres sigan siendo legibles con perspectiva.
 */
const GOYA_SCALE_MIN = 0.74;
const GOYA_SCALE_MAX = 1;

export type MatchFieldSlot = LineupSlot & { scale: number };

function normalizeDepth(y: number): number {
  return (y - SINGLE_ATTACK_Y) / (SINGLE_DEFENSE_Y - SINGLE_ATTACK_Y);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function pitchDepth(y: number): number {
  return clamp01((y - GOYA_PITCH_TOP_Y) / (GOYA_PITCH_BOTTOM_Y - GOYA_PITCH_TOP_Y));
}

function mapToHomeHalf(coord: FieldCoordinate): FieldCoordinate {
  const depth = normalizeDepth(coord.y);
  return {
    x: coord.x,
    y: HOME_ATTACK_Y + depth * (HOME_DEFENSE_Y - HOME_ATTACK_Y),
  };
}

function mapToAwayHalf(coord: FieldCoordinate): FieldCoordinate {
  const depth = normalizeDepth(coord.y);
  return {
    x: coord.x,
    y: AWAY_ATTACK_Y - depth * (AWAY_ATTACK_Y - AWAY_DEFENSE_Y),
  };
}

/** Factor de ancho según profundidad del plano Goya. */
export function goyaWidthFactor(y: number): number {
  const depth = pitchDepth(y);
  return GOYA_WIDTH_FACTOR_TOP + depth * (GOYA_WIDTH_FACTOR_BOTTOM - GOYA_WIDTH_FACTOR_TOP);
}

/** Escala de chip según profundidad (visitante arriba = más pequeño). */
export function goyaScaleFactor(y: number): number {
  const depth = pitchDepth(y);
  return GOYA_SCALE_MIN + depth * (GOYA_SCALE_MAX - GOYA_SCALE_MIN);
}

export function applyGoyaPerspective(slot: LineupSlot): MatchFieldSlot {
  const widthFactor = goyaWidthFactor(slot.y);
  const scaleFactor = goyaScaleFactor(slot.y);
  return {
    ...slot,
    x: 50 + (slot.x - 50) * widthFactor,
    scale: scaleFactor,
  };
}

export function mapSlotsToHomeHalf(slots: LineupSlot[]): MatchFieldSlot[] {
  return slots.map((slot) => applyGoyaPerspective({ ...slot, ...mapToHomeHalf(slot) }));
}

export function mapSlotsToAwayHalf(slots: LineupSlot[]): MatchFieldSlot[] {
  return slots.map((slot) => applyGoyaPerspective({ ...slot, ...mapToAwayHalf(slot) }));
}
