import type { FieldCoordinate, LineupSlot } from "@/lib/lineup/types";

/** Proporción ancho:alto del terreno reglamentario (~68×105 m). */
export const PITCH_ASPECT_CLASS = "aspect-[68/105]";

export { MODAL_FIELD_WRAPPER_SCALE, MODAL_PITCH_DECOR_SCALE } from "./modal-field-scale";

/** Campo MVP: misma superficie táctica; el rival se refleja verticalmente. */
export const MVP_PITCH_ASPECT_CLASS = PITCH_ASPECT_CLASS;

import { TACTICAL_LINE_Y } from "@/lib/lineup/formation-coordinates";

export { TACTICAL_LINE_Y };

/** Zona jugable dentro del SVG (%): alineada con el sistema maestro de coordenadas. */
export const PLAYABLE_X_MIN = 10;
export const PLAYABLE_X_MAX = 90;
export const PLAYABLE_Y_MIN = 18;
/** Permite anclar al portero en la portería inferior. */
export const PLAYABLE_Y_MAX = 94;

export type PlayableBounds = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

export const SINGLE_TEAM_BOUNDS: PlayableBounds = {
  xMin: PLAYABLE_X_MIN,
  xMax: PLAYABLE_X_MAX,
  yMin: PLAYABLE_Y_MIN,
  yMax: PLAYABLE_Y_MAX,
};

export function clampToPlayable(coord: FieldCoordinate): FieldCoordinate {
  return clampToBounds(coord, SINGLE_TEAM_BOUNDS);
}

export function clampToBounds(coord: FieldCoordinate, bounds: PlayableBounds): FieldCoordinate {
  return {
    x: Math.min(bounds.xMax, Math.max(bounds.xMin, coord.x)),
    y: Math.min(bounds.yMax, Math.max(bounds.yMin, coord.y)),
  };
}

/** Separación mínima aproximada entre centros de ficha (%). */
const MIN_GAP_X = 13;
/** Solo empujar en vertical si comparten línea (evita desplazar el 9 al carril). */
const MIN_GAP_Y = 7;
const MAX_NUDGE_PASSES = 12;

function distanceX(a: LineupSlot, b: LineupSlot): number {
  return Math.abs(a.x - b.x);
}

function distanceY(a: LineupSlot, b: LineupSlot): number {
  return Math.abs(a.y - b.y);
}

function slotsOverlap(a: LineupSlot, b: LineupSlot): boolean {
  return distanceX(a, b) < MIN_GAP_X && distanceY(a, b) < MIN_GAP_Y;
}

/**
 * Empuja ligeramente fichas que se solapan (camiseta + nombre).
 */
export function separateOverlappingSlots(
  slots: LineupSlot[],
  bounds: PlayableBounds = SINGLE_TEAM_BOUNDS
): LineupSlot[] {
  const positioned = slots.map((slot) => ({ ...slot }));

  for (let pass = 0; pass < MAX_NUDGE_PASSES; pass += 1) {
    let moved = false;

    for (let i = 0; i < positioned.length; i += 1) {
      for (let j = i + 1; j < positioned.length; j += 1) {
        const a = positioned[i]!;
        const b = positioned[j]!;
        if (!slotsOverlap(a, b)) continue;

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const pushX = dx === 0 ? MIN_GAP_X / 2 : (Math.sign(dx) * MIN_GAP_X) / 2;
        const pushY = dy === 0 ? MIN_GAP_Y / 2 : (Math.sign(dy) * MIN_GAP_Y) / 2;

        const nextA = clampToBounds({ x: a.x + pushX, y: a.y + pushY }, bounds);
        const nextB = clampToBounds({ x: b.x - pushX, y: b.y - pushY }, bounds);

        positioned[i] = { ...a, ...nextA };
        positioned[j] = { ...b, ...nextB };
        moved = true;
      }
    }

    if (!moved) break;
  }

  return positioned;
}
