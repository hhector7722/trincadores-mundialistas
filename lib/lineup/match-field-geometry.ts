import type { FieldCoordinate, LineupSlot } from "@/lib/lineup/types";

/**
 * Proyección al campo MVP compartido (visitante arriba, local abajo).
 * Usa el mismo sistema maestro de coordenadas con inversión vertical para el rival.
 */

export type MatchFieldSlot = LineupSlot & { scale: number };

/** Invierte la coordenada vertical sobre el eje central del campo (y = 50). */
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
  return applyGoyaPerspective(slot);
}

function mapSlotToAwayHalf(slot: LineupSlot): MatchFieldSlot {
  return applyGoyaPerspective({ ...slot, ...mirrorCoordVertical(slot) });
}

/** Local: coordenadas maestras sin transformar. */
export function mapSlotsToHomeHalf(slots: LineupSlot[]): MatchFieldSlot[] {
  return slots.map(mapSlotToHomeHalf);
}

/** Visitante: misma geometría reflejada verticalmente. */
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
