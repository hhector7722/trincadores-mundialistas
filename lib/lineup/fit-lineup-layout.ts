/** Proporción ancho:alto del terreno vertical (~68×105 m). */
export const VERTICAL_PITCH_ASPECT = 68 / 105;

export type BenchLayoutConfig = {
  columns: number;
  rows: number;
  heightPx: number;
  rowHeightPx: number;
  nameFontPx: number;
  numberFontPx: number;
};

export type FitLineupLayout = {
  bench: BenchLayoutConfig;
  /** Reservado para meta inferior (px). */
  metaPx: number;
};

export type ComputeFitLineupLayoutOptions = {
  widthPx: number;
  heightPx: number;
  benchCount: number;
  metaPx: number;
  gapPx?: number;
};

const BENCH_ROW_GAP = 2;
const EMPTY_BENCH: BenchLayoutConfig = {
  columns: 0,
  rows: 0,
  heightPx: 0,
  rowHeightPx: 0,
  nameFontPx: 0,
  numberFontPx: 0,
};

type BenchSizePrefs = {
  rowHeight: number;
  nameFont: number;
  numberFont: number;
  minRowHeight: number;
  minNameFont: number;
  minNumberFont: number;
};

/** Tipografía legible para suplentes en alineación individual. */
const LINEUP_BENCH: BenchSizePrefs = {
  rowHeight: 30,
  nameFont: 11,
  numberFont: 13,
  minRowHeight: 24,
  minNameFont: 9,
  minNumberFont: 11,
};

/** Campo vertical ocupa al menos ~58 % del área útil. */
const MIN_FIELD_HEIGHT_RATIO = 0.58;

function benchConfig(
  count: number,
  rowHeightPx: number,
  nameFontPx: number,
  numberFontPx: number
): BenchLayoutConfig {
  if (count <= 0) return EMPTY_BENCH;

  let best: BenchLayoutConfig | null = null;

  for (let rows = 1; rows <= Math.min(count, 4); rows += 1) {
    const columns = Math.ceil(count / rows);
    const heightPx = rows * rowHeightPx + Math.max(0, rows - 1) * BENCH_ROW_GAP;
    const candidate = { columns, rows, heightPx, rowHeightPx, nameFontPx, numberFontPx };
    if (!best || heightPx < best.heightPx) {
      best = candidate;
    }
  }

  return best ?? EMPTY_BENCH;
}

function fitBenchInHeight(
  count: number,
  maxHeight: number,
  prefs: BenchSizePrefs
): BenchLayoutConfig {
  if (count <= 0) return EMPTY_BENCH;

  let rowHeight = prefs.rowHeight;
  let nameFont = prefs.nameFont;
  let numberFont = prefs.numberFont;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const config = benchConfig(count, rowHeight, nameFont, numberFont);
    if (config.heightPx <= maxHeight + 0.5 || attempt === 9) {
      return config;
    }
    rowHeight = Math.max(prefs.minRowHeight, rowHeight - 2);
    nameFont = Math.max(prefs.minNameFont, nameFont - 0.5);
    numberFont = Math.max(prefs.minNumberFont, numberFont - 0.5);
  }

  return benchConfig(count, prefs.minRowHeight, prefs.minNameFont, prefs.minNumberFont);
}

/**
 * Alineación vertical: el campo manda; suplentes legibles en el espacio superior restante.
 */
export function computeFitLineupLayout(opts: ComputeFitLineupLayoutOptions): FitLineupLayout {
  const gap = opts.gapPx ?? 4;
  const usableWidth = Math.max(0, opts.widthPx);
  const usableHeight = Math.max(0, opts.heightPx - opts.metaPx - gap);

  const naturalFieldHeight = usableWidth / VERTICAL_PITCH_ASPECT;
  const minFieldHeight = usableHeight * MIN_FIELD_HEIGHT_RATIO;
  const fieldHeightPx = Math.max(
    minFieldHeight,
    Math.min(naturalFieldHeight, usableHeight * 0.74)
  );

  const benchSpace = Math.max(0, usableHeight - fieldHeightPx - gap);
  const bench = fitBenchInHeight(opts.benchCount, benchSpace, LINEUP_BENCH);

  return {
    bench,
    metaPx: opts.metaPx,
  };
}
