import type { FieldCoordinate, LineupSlot } from "@/lib/lineup/types";

/**
 * Proyección del modal de alineación (campo completo, position-map y: 16→90)
 * a un partido MVP con dos mitades y perspectiva Goya.
 *
 * Ratios respecto al modal de un equipo:
 * - Vertical: cada mitad ≈ 46% del rango táctico original, con hueco en el centro.
 * - Horizontal: compresión hacia el centro según profundidad del plano (arriba más estrecho).
 * - Escala: chips del visitante (arriba) más pequeños; local (abajo) casi tamaño modal.
 */

const SINGLE_ATTACK_Y = 16;
const SINGLE_DEFENSE_Y = 90;

/** Local: ataque cerca del centro, portería abajo. */
const HOME_ATTACK_Y = 58;
const HOME_DEFENSE_Y = 90;

/** Visitante: ataque cerca del centro, portería arriba. */
const AWAY_ATTACK_Y = 42;
const AWAY_DEFENSE_Y = 10;

const GOYA_PITCH_TOP_Y = 8;
const GOYA_PITCH_BOTTOM_Y = 92;

/** Compresión horizontal del plano (trapezoide del PNG Goya). */
const GOYA_WIDTH_TOP = 0.7;
const GOYA_WIDTH_BOTTOM = 1;

/** Escala visual: en la parte alta no bajar del 78% para mantener lectura. */
const GOYA_SCALE_TOP = 0.78;
const GOYA_SCALE_BOTTOM = 1;

export type MatchFieldSlot = LineupSlot & { scale: number };

function normalizeDepth(y: number): number {
  return (y - SINGLE_ATTACK_Y) / (SINGLE_DEFENSE_Y - SINGLE_ATTACK_Y);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function pitchDepth(y: number): number {
  return clamp01((y - GOYA_PITCH_TOP_Y) / (GOYA_PITCH_BOTTOM_Y - GOYA_PITCH_TOP_Y));
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

export function goyaWidthFactor(y: number): number {
  const t = pitchDepth(y);
  return GOYA_WIDTH_TOP + t * (GOYA_WIDTH_BOTTOM - GOYA_WIDTH_TOP);
}

export function goyaScaleFactor(y: number): number {
  const t = pitchDepth(y);
  return GOYA_SCALE_TOP + t * (GOYA_SCALE_BOTTOM - GOYA_SCALE_TOP);
}

export function applyGoyaPerspective(slot: LineupSlot): MatchFieldSlot {
  const width = goyaWidthFactor(slot.y);
  const scale = goyaScaleFactor(slot.y);
  return {
    ...slot,
    x: 50 + (slot.x - 50) * width,
    scale,
  };
}

export function mapSlotsToHomeHalf(slots: LineupSlot[]): MatchFieldSlot[] {
  return slots.map((slot) => applyGoyaPerspective({ ...slot, ...mapToHomeHalf(slot) }));
}

export function mapSlotsToAwayHalf(slots: LineupSlot[]): MatchFieldSlot[] {
  return slots.map((slot) => applyGoyaPerspective({ ...slot, ...mapToAwayHalf(slot) }));
}
