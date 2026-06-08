/** Grid: tendencia | pos | avatar | nombre | pts | fiab | quiz */
export const RANKING_GRID =
  "grid grid-cols-[0.625rem_1.5rem_3.25rem_minmax(0,1fr)_2.25rem_2.25rem_2.25rem] items-center gap-x-2";

/** Misma estructura que RANKING_GRID, compacto para la card de inicio. */
export const MINI_RANKING_GRID =
  "grid grid-cols-[0.5rem_1.125rem_1.5rem_minmax(0,1fr)_1.5rem_1.5rem_1.5rem] items-center gap-x-1.5";

/** Avatar destacado en la tabla completa de ranking. */
export const RANKING_AVATAR_CLASS =
  "size-12 shrink-0 rounded-full ring-2 ring-[var(--tm-accent)]/55 shadow-lg shadow-black/40";

/** Avatar compacto en la mini-tabla del home (sin marco para no rozar bordes de fila). */
export const MINI_RANKING_AVATAR_CLASS = "size-6 shrink-0 rounded-full";
