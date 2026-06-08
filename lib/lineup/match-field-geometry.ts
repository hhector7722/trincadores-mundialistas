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

export function mapSlotsToHomeHalf(slots: LineupSlot[]): LineupSlot[] {
  return slots.map((slot) => ({ ...slot, ...mapToHomeHalf(slot) }));
}

export function mapSlotsToAwayHalf(slots: LineupSlot[]): LineupSlot[] {
  return slots.map((slot) => ({ ...slot, ...mapToAwayHalf(slot) }));
}
