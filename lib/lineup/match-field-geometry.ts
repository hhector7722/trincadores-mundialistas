import type { FieldCoordinate, LineupSlot } from "@/lib/lineup/types";

/** Coordenadas del once individual (y: 16 ataque, y: 90 portería). */
const SINGLE_ATTACK_Y = 16;
const SINGLE_DEFENSE_Y = 90;

/** Mitad inferior: local ataca hacia el centro. */
const HOME_ATTACK_Y = 56;
const HOME_DEFENSE_Y = 93;

/** Mitad superior: visitante ataca hacia el centro. */
const AWAY_ATTACK_Y = 44;
const AWAY_DEFENSE_Y = 7;

/** Límites verticales del plano de juego en la imagen Goya (%). */
const GOYA_PITCH_TOP_Y = 8;
const GOYA_PITCH_BOTTOM_Y = 92;

/** Ancho aparente del campo: estrecho arriba, ancho abajo (perspectiva). */
const GOYA_WIDTH_FACTOR_TOP = 0.66;
const GOYA_WIDTH_FACTOR_BOTTOM = 1;

export type MatchFieldSlot = LineupSlot & { scale: number };

function normalizeDepth(y: number): number {
  return (y - SINGLE_ATTACK_Y) / (SINGLE_DEFENSE_Y - SINGLE_ATTACK_Y);
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

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Factor de ancho/escala según la profundidad del plano Goya (0 = arriba, 1 = abajo). */
export function goyaPerspectiveFactor(y: number): number {
  const depth = clamp01((y - GOYA_PITCH_TOP_Y) / (GOYA_PITCH_BOTTOM_Y - GOYA_PITCH_TOP_Y));
  return GOYA_WIDTH_FACTOR_TOP + depth * (GOYA_WIDTH_FACTOR_BOTTOM - GOYA_WIDTH_FACTOR_TOP);
}

/** Comprime x hacia el centro y devuelve escala proporcional al estrechamiento del campo. */
export function applyGoyaPerspective(slot: LineupSlot): MatchFieldSlot {
  const factor = goyaPerspectiveFactor(slot.y);
  return {
    ...slot,
    x: 50 + (slot.x - 50) * factor,
    scale: factor,
  };
}

export function mapSlotsToHomeHalf(slots: LineupSlot[]): MatchFieldSlot[] {
  return slots.map((slot) => applyGoyaPerspective({ ...slot, ...mapToHomeHalf(slot) }));
}

export function mapSlotsToAwayHalf(slots: LineupSlot[]): MatchFieldSlot[] {
  return slots.map((slot) => applyGoyaPerspective({ ...slot, ...mapToAwayHalf(slot) }));
}
