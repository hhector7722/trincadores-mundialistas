import type { FieldCoordinate, LineupSlot } from "@/lib/lineup/types";

/** Proporción ancho:alto de un campo en vista vertical (~68×105 m). */
export const PITCH_ASPECT_CLASS = "aspect-[68/105]";

/** Campo MVP (dos equipos): un poco más alto que un solo equipo. */
export const MVP_PITCH_ASPECT_CLASS = "aspect-[68/130]";

/** Zona jugable dentro del SVG (%): evita esquinas y líneas de banda. */
export const PLAYABLE_X_MIN = 20;
export const PLAYABLE_X_MAX = 80;
export const PLAYABLE_Y_MIN = 18;
export const PLAYABLE_Y_MAX = 82;

export function clampToPlayable(coord: FieldCoordinate): FieldCoordinate {
  return {
    x: Math.min(PLAYABLE_X_MAX, Math.max(PLAYABLE_X_MIN, coord.x)),
    y: Math.min(PLAYABLE_Y_MAX, Math.max(PLAYABLE_Y_MIN, coord.y)),
  };
}

/** Separación mínima aproximada entre centros de ficha (%). */
const MIN_GAP_X = 13;
const MIN_GAP_Y = 11;
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
export function separateOverlappingSlots(slots: LineupSlot[]): LineupSlot[] {
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

        const nextA = clampToPlayable({ x: a.x + pushX, y: a.y + pushY });
        const nextB = clampToPlayable({ x: b.x - pushX, y: b.y - pushY });

        positioned[i] = { ...a, ...nextA };
        positioned[j] = { ...b, ...nextB };
        moved = true;
      }
    }

    if (!moved) break;
  }

  return positioned;
}
