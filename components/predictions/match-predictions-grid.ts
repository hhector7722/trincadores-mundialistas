/** Columnas: avatar | nombre | local | visitante | mvp */
const MATCH_PREDICTIONS_COLUMNS_BASE =
  "grid-cols-[auto_minmax(0,2fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,1fr)]";

/** Partidos finalizados: avatar | nombre | iconos | local | visitante | mvp */
const MATCH_PREDICTIONS_COLUMNS_WITH_OUTCOMES =
  "grid-cols-[auto_minmax(0,2fr)_minmax(2rem,auto)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,1fr)]";

export const MATCH_PREDICTIONS_GRID = `grid w-full ${MATCH_PREDICTIONS_COLUMNS_BASE} items-center gap-x-1.5`;

export function matchPredictionsGrid(showOutcomes: boolean): string {
  const columns = showOutcomes
    ? MATCH_PREDICTIONS_COLUMNS_WITH_OUTCOMES
    : MATCH_PREDICTIONS_COLUMNS_BASE;
  return `grid w-full ${columns} items-center gap-x-1.5`;
}

export const MATCH_PREDICTIONS_SUBGRID_ROW =
  "col-span-5 grid h-full grid-cols-subgrid items-center px-2 min-h-0";

export const MATCH_PREDICTIONS_SUBGRID_ROW_WITH_OUTCOMES =
  "col-span-6 grid h-full grid-cols-subgrid items-center px-2 min-h-0";

export function matchPredictionsSubgridRow(showOutcomes: boolean): string {
  return showOutcomes
    ? MATCH_PREDICTIONS_SUBGRID_ROW_WITH_OUTCOMES
    : MATCH_PREDICTIONS_SUBGRID_ROW;
}

export const MATCH_PREDICTIONS_ROW_COUNT = 11;
