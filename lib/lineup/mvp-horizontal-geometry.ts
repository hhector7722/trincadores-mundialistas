import { TACTICAL_Y } from "@/lib/lineup/formation-coordinates";
import type { FieldCoordinate, LineupSlot } from "@/lib/lineup/types";

/**
 * Proyección al campo MVP horizontal.
 * Local a la izquierda (banquillo arriba); visitante a la derecha.
 * Ambos equipos espejan el eje lateral al rotar 90° sobre el terreno.
 */

export type MvpHorizontalSlot = LineupSlot & { scale: number };

const SOURCE_Y_ATTACK = TACTICAL_Y.FORWARD;
const SOURCE_Y_GK = TACTICAL_Y.GOALKEEPER;
const SOURCE_Y_SPAN = SOURCE_Y_GK - SOURCE_Y_ATTACK;

/** Mitad izquierda: local (portero en borde izquierdo, ataque hacia el centro). */
export const HOME_HALF_X = { MIN: 8, MAX: 46 } as const;

/** Mitad derecha: visitante (portero en borde derecho, ataque hacia el centro). */
export const AWAY_HALF_X = { MIN: 54, MAX: 92 } as const;

const HOME_X_SPAN = HOME_HALF_X.MAX - HOME_HALF_X.MIN;
const AWAY_X_SPAN = AWAY_HALF_X.MAX - AWAY_HALF_X.MIN;

/** Rango vertical jugable (posición lateral de la plantilla maestra). */
export const PLAYABLE_Y_MIN = 12;
export const PLAYABLE_Y_MAX = 88;

function sourceDepth(y: number): number {
  return (SOURCE_Y_GK - y) / SOURCE_Y_SPAN;
}

function clampY(y: number): number {
  return Math.min(PLAYABLE_Y_MAX, Math.max(PLAYABLE_Y_MIN, y));
}

/** Espejo lateral al rotar sobre el terreno (LD↔LI, extremo dcho↔izdo, etc.). */
export function mirrorTacticalLateral(coord: FieldCoordinate): FieldCoordinate {
  return { ...coord, x: Math.round((100 - coord.x) * 10) / 10 };
}

/** Local (coord ya espejada): profundidad → eje X hacia la derecha; lateral → eje Y. */
export function compressCoordToHomeLeft(coord: FieldCoordinate): FieldCoordinate {
  const depth = sourceDepth(coord.y);
  return {
    x: Math.round((HOME_HALF_X.MIN + depth * HOME_X_SPAN) * 10) / 10,
    y: Math.round(clampY(coord.x) * 10) / 10,
  };
}

/** Visitante (coord ya espejada): profundidad → eje X hacia la izquierda; lateral → eje Y. */
export function compressCoordToAwayRight(coord: FieldCoordinate): FieldCoordinate {
  const depth = sourceDepth(coord.y);
  return {
    x: Math.round((AWAY_HALF_X.MAX - depth * AWAY_X_SPAN) * 10) / 10,
    y: Math.round(clampY(coord.x) * 10) / 10,
  };
}

function mapSlotToHomeLeft(slot: LineupSlot): MvpHorizontalSlot {
  const mirrored = mirrorTacticalLateral(slot);
  return { ...slot, ...compressCoordToHomeLeft(mirrored), scale: 1 };
}

function mapSlotToAwayRight(slot: LineupSlot): MvpHorizontalSlot {
  const mirrored = mirrorTacticalLateral(slot);
  return { ...slot, ...compressCoordToAwayRight(mirrored), scale: 1 };
}

/** Local en mitad izquierda del campo horizontal (con espejo lateral). */
export function mapSlotsToHomeLeft(slots: LineupSlot[]): MvpHorizontalSlot[] {
  return slots.map(mapSlotToHomeLeft);
}

/** Visitante en mitad derecha del campo horizontal (con espejo lateral). */
export function mapSlotsToAwayRight(slots: LineupSlot[]): MvpHorizontalSlot[] {
  return slots.map(mapSlotToAwayRight);
}
