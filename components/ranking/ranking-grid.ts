import {
  AVATAR_DISPLAY_HOME_MINI,
  AVATAR_DISPLAY_RANKING,
} from "@/lib/avatars/display-classes";

/** Grid: tendencia | pos | avatar | nombre | pts | fiab | quiz */
export const RANKING_GRID =
  "grid grid-cols-[0.625rem_1.5rem_3.75rem_minmax(0,1fr)_2.25rem_2.25rem_2.25rem] items-center gap-x-2";

/** Compacto para la card de inicio (sin columna quiz). */
export const MINI_RANKING_GRID =
  "grid grid-cols-[0.5rem_1.125rem_1.75rem_minmax(0,1fr)_1.5rem_1.5rem] items-center gap-x-1.5";

export const RANKING_AVATAR_CLASS = AVATAR_DISPLAY_RANKING;

export const MINI_RANKING_AVATAR_CLASS = AVATAR_DISPLAY_HOME_MINI;
