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
export const PLAYABLE_Y_MAX = 98;

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

