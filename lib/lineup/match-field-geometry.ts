import type { FieldCoordinate, LineupSlot } from "@/lib/lineup/types";

/**
 * Proyección del once de un equipo al campo compartido MVP (local abajo, visitante arriba).
 * Sin compresión horizontal agresiva para evitar solapes entre equipos y entre líneas.
 */

const LINEUP_ATTACK_Y = 16;
const LINEUP_DEFENSE_Y = 90;

const MIDFIELD_Y = 50;

/** Hueco amplio entre bloques para que no se pisen local y visitante. */
const MIDFIELD_GAP = 16;

const HOME_BLOCK_SHIFT_Y = 4;
const HOME_ATTACK_Y = MIDFIELD_Y + MIDFIELD_GAP + HOME_BLOCK_SHIFT_Y;
const HOME_DEFENSE_Y = 92;

const AWAY_BLOCK_SHIFT_Y = -8;
const AWAY_ATTACK_Y = MIDFIELD_Y - MIDFIELD_GAP + AWAY_BLOCK_SHIFT_Y;
const AWAY_DEFENSE_Y = 8;

const GOYA_PITCH_TOP_Y = 8;
const GOYA_PITCH_BOTTOM_Y = 92;

const GOYA_SCALE_TOP = 0.82;
const GOYA_SCALE_BOTTOM = 1;

const AWAY_MF_FW_SHIFT_Y = -1;
const HOME_FW_SHIFT_Y = 1;

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

function applyAwayAttackLineShift(slot: LineupSlot): LineupSlot {
  if (slot.role !== "MF" && slot.role !== "FW") return slot;
  return { ...slot, y: slot.y + AWAY_MF_FW_SHIFT_Y };
}

function applyHomeForwardShift(slot: LineupSlot): LineupSlot {
  if (slot.role !== "FW") return slot;
  return { ...slot, y: slot.y + HOME_FW_SHIFT_Y };
}

export function applyGoyaPerspective(slot: LineupSlot): MatchFieldSlot {
  return {
    ...slot,
    scale: goyaScaleFactor(slot.y),
  };
}

function mapSlotToHomeHalf(slot: LineupSlot): MatchFieldSlot {
  const positioned = applyHomeForwardShift({ ...slot, ...mapToHomeHalf(slot) });
  return applyGoyaPerspective(positioned);
}

function mapSlotToAwayHalf(slot: LineupSlot): MatchFieldSlot {
  const positioned = applyAwayAttackLineShift({ ...slot, ...mapToAwayHalf(slot) });
  return applyGoyaPerspective(positioned);
}

export function mapSlotsToHomeHalf(slots: LineupSlot[]): MatchFieldSlot[] {
  return slots.map(mapSlotToHomeHalf);
}

export function mapSlotsToAwayHalf(slots: LineupSlot[]): MatchFieldSlot[] {
  return slots.map(mapSlotToAwayHalf);
}

/** Compatibilidad con código que aún consulta el factor de ancho. */
export function goyaWidthFactor(_y: number): number {
  return 1;
}
