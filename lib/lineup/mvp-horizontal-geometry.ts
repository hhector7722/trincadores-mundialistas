import { TACTICAL_X, TACTICAL_Y } from "@/lib/lineup/formation-coordinates";
import { separateOverlappingSlots, type PlayableBounds } from "@/lib/lineup/field-layout";
import type { FieldCoordinate, LineupSlot } from "@/lib/lineup/types";

/**
 * Proyección al campo MVP horizontal.
 * Local a la izquierda (banquillo arriba); visitante a la derecha (banquillo abajo).
 * El lateral (LI/LD, etc.) viene del slot BSD anclado en la formación, no de espejar al rotar.
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

/**
 * Rango vertical jugable (posición lateral de la plantilla maestra).
 * Margen interior para que camiseta + nombre no sobresalgan del verde
 * (anclaje centrado con translate -50%, -50%).
 */
export const PLAYABLE_Y_MIN = 20;
export const PLAYABLE_Y_MAX = 78;

function sourceDepth(y: number): number {
  return (SOURCE_Y_GK - y) / SOURCE_Y_SPAN;
}

/** Remapea el eje lateral maestro (10–90 %) al rango vertical jugable sin colapsar posiciones. */
export function mapLateralToPlayableY(x: number): number {
  const clamped = Math.min(TACTICAL_X.UR, Math.max(TACTICAL_X.UL, x));
  const t = (clamped - TACTICAL_X.UL) / (TACTICAL_X.UR - TACTICAL_X.UL);
  return Math.round((PLAYABLE_Y_MIN + t * (PLAYABLE_Y_MAX - PLAYABLE_Y_MIN)) * 10) / 10;
}

function mvpHalfBounds(isHome: boolean): PlayableBounds {
  return isHome
    ? {
        xMin: HOME_HALF_X.MIN,
        xMax: HOME_HALF_X.MAX,
        yMin: PLAYABLE_Y_MIN,
        yMax: PLAYABLE_Y_MAX,
      }
    : {
        xMin: AWAY_HALF_X.MIN,
        xMax: AWAY_HALF_X.MAX,
        yMin: PLAYABLE_Y_MIN,
        yMax: PLAYABLE_Y_MAX,
      };
}

function separateMvpSlots(slots: MvpHorizontalSlot[], isHome: boolean): MvpHorizontalSlot[] {
  return separateOverlappingSlots(slots, mvpHalfBounds(isHome)).map((slot) => ({
    ...slot,
    scale: 1,
  }));
}

/** Local: profundidad → eje X hacia la derecha; lateral del ancla → eje Y. */
export function compressCoordToHomeLeft(coord: FieldCoordinate): FieldCoordinate {
  const depth = sourceDepth(coord.y);
  return {
    x: Math.round((HOME_HALF_X.MIN + depth * HOME_X_SPAN) * 10) / 10,
    y: mapLateralToPlayableY(coord.x),
  };
}

/** Visitante: profundidad → eje X hacia la izquierda; lateral del ancla → eje Y. */
export function compressCoordToAwayRight(coord: FieldCoordinate): FieldCoordinate {
  const depth = sourceDepth(coord.y);
  return {
    x: Math.round((AWAY_HALF_X.MAX - depth * AWAY_X_SPAN) * 10) / 10,
    y: mapLateralToPlayableY(coord.x),
  };
}

function mapSlotToHomeLeft(slot: LineupSlot): MvpHorizontalSlot {
  return { ...slot, ...compressCoordToHomeLeft(slot), scale: 1 };
}

function mapSlotToAwayRight(slot: LineupSlot): MvpHorizontalSlot {
  return { ...slot, ...compressCoordToAwayRight(slot), scale: 1 };
}

/** Local en mitad izquierda del campo horizontal. */
export function mapSlotsToHomeLeft(slots: LineupSlot[]): MvpHorizontalSlot[] {
  return separateMvpSlots(slots.map(mapSlotToHomeLeft), true);
}

/** Visitante en mitad derecha del campo horizontal. */
export function mapSlotsToAwayRight(slots: LineupSlot[]): MvpHorizontalSlot[] {
  return separateMvpSlots(slots.map(mapSlotToAwayRight), false);
}
