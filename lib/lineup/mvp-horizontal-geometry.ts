import { TACTICAL_Y } from "@/lib/lineup/formation-coordinates";
import {
  MVP_FIELD_EFFECTIVE_CHIP_SCALE,
  resolveTacticalSlotCollisions,
  type TacticalCollisionMode,
} from "@/lib/lineup/tactical-collision-resolve";
import type { PlayableBounds } from "@/lib/lineup/field-layout";
import type { FieldCoordinate, LineupSlot } from "@/lib/lineup/types";

/**
 * Proyección al campo MVP horizontal (visitante izquierda → derecha, local derecha → izquierda).
 * Rota el eje de profundidad táctica al eje horizontal del terreno.
 */

export type MvpHorizontalSlot = LineupSlot & { scale: number };

const SOURCE_Y_ATTACK = TACTICAL_Y.FORWARD;
const SOURCE_Y_GK = TACTICAL_Y.GOALKEEPER;
const SOURCE_Y_SPAN = SOURCE_Y_GK - SOURCE_Y_ATTACK;

/** Mitad izquierda: visitante (portero en x bajo, delanteros hacia el centro). */
export const AWAY_HALF_X = { MIN: 8, MAX: 46 } as const;

/** Mitad derecha: local (portero en x alto, delanteros hacia el centro). */
export const HOME_HALF_X = { MIN: 54, MAX: 92 } as const;

const AWAY_X_SPAN = AWAY_HALF_X.MAX - AWAY_HALF_X.MIN;
const HOME_X_SPAN = HOME_HALF_X.MAX - HOME_HALF_X.MIN;

/** Rango vertical jugable (posición lateral de la plantilla maestra). */
export const PLAYABLE_Y_MIN = 12;
export const PLAYABLE_Y_MAX = 88;

export const AWAY_HORIZONTAL_BOUNDS: PlayableBounds = {
  xMin: AWAY_HALF_X.MIN,
  xMax: AWAY_HALF_X.MAX,
  yMin: PLAYABLE_Y_MIN,
  yMax: PLAYABLE_Y_MAX,
};

export const HOME_HORIZONTAL_BOUNDS: PlayableBounds = {
  xMin: HOME_HALF_X.MIN,
  xMax: HOME_HALF_X.MAX,
  yMin: PLAYABLE_Y_MIN,
  yMax: PLAYABLE_Y_MAX,
};

function sourceDepth(y: number): number {
  return (SOURCE_Y_GK - y) / SOURCE_Y_SPAN;
}

function clampY(y: number): number {
  return Math.min(PLAYABLE_Y_MAX, Math.max(PLAYABLE_Y_MIN, y));
}

/** Visitante: profundidad → eje X hacia la derecha; lateral maestro → eje Y. */
export function compressCoordToAwayLeft(coord: FieldCoordinate): FieldCoordinate {
  const depth = sourceDepth(coord.y);
  return {
    x: Math.round((AWAY_HALF_X.MIN + depth * AWAY_X_SPAN) * 10) / 10,
    y: Math.round(clampY(coord.x) * 10) / 10,
  };
}

/** Local: profundidad → eje X hacia la izquierda; lateral maestro → eje Y. */
export function compressCoordToHomeRight(coord: FieldCoordinate): FieldCoordinate {
  const depth = sourceDepth(coord.y);
  return {
    x: Math.round((HOME_HALF_X.MAX - depth * HOME_X_SPAN) * 10) / 10,
    y: Math.round(clampY(coord.x) * 10) / 10,
  };
}

function mapSlotToAwayLeft(slot: LineupSlot): MvpHorizontalSlot {
  return { ...slot, ...compressCoordToAwayLeft(slot), scale: 1 };
}

function mapSlotToHomeRight(slot: LineupSlot): MvpHorizontalSlot {
  return { ...slot, ...compressCoordToHomeRight(slot), scale: 1 };
}

function resolveHorizontalHalf(
  slots: LineupSlot[],
  mapFn: (slot: LineupSlot) => MvpHorizontalSlot,
  bounds: PlayableBounds,
  mode: TacticalCollisionMode
): MvpHorizontalSlot[] {
  const mapped = slots.map(mapFn);
  return resolveTacticalSlotCollisions(mapped, {
    bounds,
    mode,
    chipScale: MVP_FIELD_EFFECTIVE_CHIP_SCALE,
    maxNudge: 16,
  }).map((slot) => ({
    ...slot,
    scale: 1,
  }));
}

/** Visitante en mitad izquierda del campo horizontal. */
export function mapSlotsToAwayLeft(slots: LineupSlot[]): MvpHorizontalSlot[] {
  return resolveHorizontalHalf(
    slots,
    mapSlotToAwayLeft,
    AWAY_HORIZONTAL_BOUNDS,
    "horizontal-away"
  );
}

/** Local en mitad derecha del campo horizontal. */
export function mapSlotsToHomeRight(slots: LineupSlot[]): MvpHorizontalSlot[] {
  return resolveHorizontalHalf(
    slots,
    mapSlotToHomeRight,
    HOME_HORIZONTAL_BOUNDS,
    "horizontal-home"
  );
}
