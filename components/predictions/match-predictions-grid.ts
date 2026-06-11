/** Columnas a ancho completo: avatar | nombre | local | visitante | mvp */
export const MATCH_PREDICTIONS_COLUMNS =
  "grid-cols-[auto_minmax(0,2fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,1fr)]";

export const MATCH_PREDICTIONS_GRID = `grid w-full ${MATCH_PREDICTIONS_COLUMNS} items-center gap-x-1.5`;

export const MATCH_PREDICTIONS_SUBGRID_ROW =
  "col-span-5 grid grid-cols-subgrid items-center px-2 min-h-0";

export const MATCH_PREDICTIONS_ROW_COUNT = 11;
