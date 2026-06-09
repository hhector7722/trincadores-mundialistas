import type { FieldCoordinate, LineupSlot } from "@/lib/lineup/types";

/**
 * Proyección al campo MVP compartido (visitante arriba, local abajo).
 * El campo SVG tiene porterías arriba/abajo; cada equipo ocupa su mitad vertical.
 */

/** Rango táctico del modal (y alto = ataque, y bajo = portería). */
const LINEUP_ATTACK_Y = 16;
const LINEUP_DEFENSE_Y = 84;

const MIDFIELD_Y = 50;
const MIDFIELD_GAP = 12;

/** Visitante: portería arriba (y bajo en su sistema → arriba en pantalla). */
const AWAY_ATTACK_Y = MIDFIELD_Y - MIDFIELD_GAP;
const AWAY_DEFENSE_Y = 12;

/** Local: portería abajo. */
const HOME_ATTACK_Y = MIDFIELD_Y + MIDFIELD_GAP;
const HOME_DEFENSE_Y = 88;

const GOYA_PITCH_TOP_Y = 8;
const GOYA_PITCH_BOTTOM_Y = 92;

const GOYA_SCALE_TOP = 0.86;
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

function mapToHomeHalf(coord: FieldCoordinate): FieldCoordinate {
  const depth = lineupDepth(coord.y);
  return {
    x: coord.x,
    y: HOME_ATTACK_Y + depth * (HOME_DEFENSE_Y - HOME_ATTACK_Y),
  };
}

function mapToAwayHalf(coord: FieldCoordinate): FieldCoordinate {
  const depth = lineupDepth(coord.y);
  return {
    x: coord.x,
    y: AWAY_ATTACK_Y - depth * (AWAY_ATTACK_Y - AWAY_DEFENSE_Y),
  };
}

export function goyaScaleFactor(y: number): number {
  const t = pitchDepth(y);
  return GOYA_SCALE_TOP + t * (GOYA_SCALE_BOTTOM - GOYA_SCALE_TOP);
}

export function applyGoyaPerspective(slot: LineupSlot): MatchFieldSlot {
  return {
    ...slot,
    scale: goyaScaleFactor(slot.y),
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

export function goyaWidthFactor(_y: number): number {
  return 1;
}
