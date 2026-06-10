export type BenchLayoutConfig = {
  columns: number;
  rows: number;
  heightPx: number;
  rowHeightPx: number;
  nameFontPx: number;
  numberFontPx: number;
};

export type BenchSizePrefs = {
  rowHeight: number;
  nameFont: number;
  numberFont: number;
  minRowHeight: number;
  minNameFont: number;
  minNumberFont: number;
};

export type PickBenchGridOptions = {
  minRows?: number;
  maxRows?: number;
  maxColumns?: number;
};

const BENCH_ROW_GAP = 2;

export const EMPTY_BENCH: BenchLayoutConfig = {
  columns: 0,
  rows: 0,
  heightPx: 0,
  rowHeightPx: 0,
  nameFontPx: 0,
  numberFontPx: 0,
};

function gridHeight(rows: number, rowHeightPx: number): number {
  return rows * rowHeightPx + Math.max(0, rows - 1) * BENCH_ROW_GAP;
}

/**
 * Elige una rejilla multi-fila legible que quepa en `maxHeight`.
 * Prioriza más filas (evita una única fila larguísima).
 */
export function pickBenchGrid(
  count: number,
  maxHeight: number,
  prefs: BenchSizePrefs,
  options: PickBenchGridOptions = {}
): BenchLayoutConfig {
  if (count <= 0) return EMPTY_BENCH;

  const minRowsDefault = count >= 8 ? 2 : 1;
  const minRows = options.minRows ?? minRowsDefault;
  const maxRows = options.maxRows ?? Math.min(count, 4);
  const maxColumns = options.maxColumns ?? 10;

  let rowHeight = prefs.rowHeight;
  let nameFont = prefs.nameFont;
  let numberFont = prefs.numberFont;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    let best: BenchLayoutConfig | null = null;

    for (let rows = maxRows; rows >= minRows; rows -= 1) {
      const columns = Math.ceil(count / rows);
      if (columns > maxColumns) continue;

      const heightPx = gridHeight(rows, rowHeight);
      if (heightPx > maxHeight + 0.5) continue;

      const candidate: BenchLayoutConfig = {
        columns,
        rows,
        heightPx,
        rowHeightPx: rowHeight,
        nameFontPx: nameFont,
        numberFontPx: numberFont,
      };

      if (
        !best ||
        candidate.rows > best.rows ||
        (candidate.rows === best.rows && candidate.nameFontPx > best.nameFontPx)
      ) {
        best = candidate;
      }
    }

    if (best) return best;

    rowHeight = Math.max(prefs.minRowHeight, rowHeight - 2);
    nameFont = Math.max(prefs.minNameFont, nameFont - 0.5);
    numberFont = Math.max(prefs.minNumberFont, numberFont - 0.5);
  }

  const rows = Math.min(maxRows, Math.max(minRows, Math.ceil(count / maxColumns)));
  const columns = Math.ceil(count / rows);

  return {
    columns,
    rows,
    heightPx: gridHeight(rows, prefs.minRowHeight),
    rowHeightPx: prefs.minRowHeight,
    nameFontPx: prefs.minNameFont,
    numberFontPx: prefs.minNumberFont,
  };
}
