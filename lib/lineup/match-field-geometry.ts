import { TACTICAL_Y } from "@/lib/lineup/formation-coordinates";
import type { FieldCoordinate, LineupSlot } from "@/lib/lineup/types";

/**
 * Proyección al campo MVP compartido (visitante arriba, local abajo).
 * Comprime las coords maestras de campo completo a cada mitad sin mezclar equipos.
 */

export type MatchFieldSlot = LineupSlot & { scale: number };

/** Rango vertical de las plantillas en vista individual (delantero → portero). */
const SOURCE_Y_ATTACK = TACTICAL_Y.FORWARD;
const SOURCE_Y_GK = TACTICAL_Y.GOALKEEPER;
const SOURCE_Y_SPAN = SOURCE_Y_GK - SOURCE_Y_ATTACK;

/** Mitad superior: exclusiva del visitante (y < 50). */
export const AWAY_HALF_Y = { MIN: 10, MAX: 40 } as const;

/** Mitad inferior: exclusiva del local (y > 50). */
export const HOME_HALF_Y = { MIN: 60, MAX: 90 } as const;

const AWAY_HALF_SPAN = AWAY_HALF_Y.MAX - AWAY_HALF_Y.MIN;
const HOME_HALF_SPAN = HOME_HALF_Y.MAX - HOME_HALF_Y.MIN;

function sourceDepth(y: number): number {
  return (SOURCE_Y_GK - y) / SOURCE_Y_SPAN;
}

/** Comprime coord maestra a la mitad superior (portero arriba, delanteros hacia el centro). */
export function compressCoordToAwayHalf(coord: FieldCoordinate): FieldCoordinate {
  const depth = sourceDepth(coord.y);
  return {
    x: coord.x,
    y: Math.round((AWAY_HALF_Y.MIN + depth * AWAY_HALF_SPAN) * 10) / 10,
  };
}

/** Comprime coord maestra a la mitad inferior (portero abajo, delanteros hacia el centro). */
export function compressCoordToHomeHalf(coord: FieldCoordinate): FieldCoordinate {
  const depth = sourceDepth(coord.y);
  return {
    x: coord.x,
    y: Math.round((HOME_HALF_Y.MAX - depth * HOME_HALF_SPAN) * 10) / 10,
  };
}

/** @deprecated Usar compressCoordToAwayHalf; conservado para tests legacy. */
export function mirrorCoordVertical(coord: FieldCoordinate): FieldCoordinate {
  return { x: coord.x, y: 100 - coord.y };
}

export function applyGoyaPerspective(slot: LineupSlot): MatchFieldSlot {
  return {
    ...slot,
    scale: 1,
  };
}

function mapSlotToHomeHalf(slot: LineupSlot): MatchFieldSlot {
  return applyGoyaPerspective({ ...slot, ...compressCoordToHomeHalf(slot) });
}

function mapSlotToAwayHalf(slot: LineupSlot): MatchFieldSlot {
  return applyGoyaPerspective({ ...slot, ...compressCoordToAwayHalf(slot) });
}

/** Local: mitad inferior comprimida desde plantilla maestra. */
export function mapSlotsToHomeHalf(slots: LineupSlot[]): MatchFieldSlot[] {
  return slots.map(mapSlotToHomeHalf);
}

/** Visitante: mitad superior comprimida desde plantilla maestra. */
export function mapSlotsToAwayHalf(slots: LineupSlot[]): MatchFieldSlot[] {
  return slots.map(mapSlotToAwayHalf);
}

export function goyaScaleFactor(_y: number): number {
  return 1;
}

export function goyaWidthFactor(_y: number): number {
  return 1;
}
