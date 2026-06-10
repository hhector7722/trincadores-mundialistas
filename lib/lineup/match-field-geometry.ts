import type { FieldCoordinate, LineupSlot } from "@/lib/lineup/types";
import type { PlayableBounds } from "@/lib/lineup/field-layout";

/**
 * Proyección al campo MVP compartido (visitante arriba, local abajo).
 * Usa bandas tácticas discretas para evitar solapes GK–defensa tras comprimir la mitad.
 */

const AWAY_LINE_Y = [6, 13, 20, 25, 29] as const;
const HOME_LINE_Y = [71, 76, 82, 88, 93] as const;

export const MVP_AWAY_BOUNDS: PlayableBounds = {
  xMin: 10,
  xMax: 90,
  yMin: 5,
  yMax: 31,
};

export const MVP_HOME_BOUNDS: PlayableBounds = {
  xMin: 10,
  xMax: 90,
  yMin: 69,
  yMax: 95,
};

export type MatchFieldSlot = LineupSlot & { scale: number };

function lineupLineIndex(y: number): number {
  if (y >= 85) return 0;
  if (y >= 68) return 1;
  if (y >= 47) return 2;
  if (y >= 32) return 3;
  return 4;
}

function mapToHomeHalf(coord: FieldCoordinate): FieldCoordinate {
  const line = lineupLineIndex(coord.y);
  const inverted = AWAY_LINE_Y.length - 1 - line;
  return {
    x: coord.x,
    y: HOME_LINE_Y[inverted] ?? HOME_LINE_Y[HOME_LINE_Y.length - 1]!,
  };
}

function mapToAwayHalf(coord: FieldCoordinate): FieldCoordinate {
  const line = lineupLineIndex(coord.y);
  return {
    x: coord.x,
    y: AWAY_LINE_Y[line] ?? AWAY_LINE_Y[AWAY_LINE_Y.length - 1]!,
  };
}

export function applyGoyaPerspective(slot: LineupSlot): MatchFieldSlot {
  return {
    ...slot,
    scale: 1,
  };
}

function mapSlotToHomeHalf(slot: LineupSlot): MatchFieldSlot {
  return applyGoyaPerspective({ ...slot, ...mapToHomeHalf(slot) });
}

function mapSlotToAwayHalf(slot: LineupSlot): MatchFieldSlot {
  return applyGoyaPerspective({ ...slot, ...mapToAwayHalf(slot) });
}

export function mapSlotsToHomeHalf(slots: LineupSlot[]): MatchFieldSlot[] {
  return slots.map(mapSlotToHomeHalf);
}

export function mapSlotsToAwayHalf(slots: LineupSlot[]): MatchFieldSlot[] {
  return slots.map(mapSlotToAwayHalf);
}

/** Reservado por compatibilidad con tests/UI; el MVP usa escala uniforme. */
export function goyaScaleFactor(_y: number): number {
  return 1;
}

export function goyaWidthFactor(_y: number): number {
  return 1;
}
