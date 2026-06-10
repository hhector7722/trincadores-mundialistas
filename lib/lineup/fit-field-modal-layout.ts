/** Proporción ancho:alto del terreno reglamentario (~68×105 m). */
export const PITCH_ASPECT = 68 / 105;

export type FitFieldModalLayoutMode = "lineup" | "mvp";

export type BenchLayoutConfig = {
  columns: number;
  rows: number;
  heightPx: number;
  rowHeightPx: number;
  nameFontPx: number;
  numberFontPx: number;
};

export type FitFieldModalLayout = {
  fieldWidthPx: number;
  fieldHeightPx: number;
  chipScale: number;
  awayBench: BenchLayoutConfig;
  homeBench: BenchLayoutConfig;
  /** Si false, el campo usa tamaño CSS natural (prioridad alineación individual). */
  fieldExplicit?: boolean;
};

export type ComputeFitFieldModalLayoutOptions = {
  widthPx: number;
  heightPx: number;
  awayBenchCount: number;
  homeBenchCount: number;
  footerPx: number;
  /** Espacio entre bloques (campo ↔ banquillos ↔ formaciones). */
  gapPx?: number;
  mode?: FitFieldModalLayoutMode;
  /** MVP: altura reservada por fila de formación externa (×2 equipos). */
  formationRowPx?: number;
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

const LINEUP_BENCH: BenchSizePrefs = {
  rowHeight: 28,
  nameFont: 10,
  numberFont: 12,
  minRowHeight: 22,
  minNameFont: 8,
  minNumberFont: 10,
};

const MVP_BENCH: BenchSizePrefs = {
  rowHeight: 24,
  nameFont: 9,
  numberFont: 11,
  minRowHeight: 20,
  minNameFont: 8,
  minNumberFont: 9,
};

/** Reducción del campo MVP respecto al máximo teórico (~20 %). */
const MVP_FIELD_SCALE = 0.8;

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
 * Alineación individual/modal: el campo manda; banquillo legible en el espacio restante.
 */
function computeLineupLayout(opts: ComputeFitFieldModalLayoutOptions): FitFieldModalLayout {
  const gap = opts.gapPx ?? 4;
  const benchCount = opts.awayBenchCount + opts.homeBenchCount;
  const usableWidth = Math.max(0, opts.widthPx);
  const usableHeight = Math.max(0, opts.heightPx - opts.footerPx - gap);

  const naturalFieldHeight = usableWidth / PITCH_ASPECT;
  const minFieldHeight = usableHeight * 0.52;
  let fieldHeightPx = Math.max(minFieldHeight, Math.min(naturalFieldHeight, usableHeight * 0.72));

  let benchSpace = Math.max(0, usableHeight - fieldHeightPx - gap);
  let awayBench = fitBenchInHeight(opts.awayBenchCount, benchSpace, LINEUP_BENCH);

  if (awayBench.heightPx > benchSpace + 0.5 && benchCount > 0) {
    fieldHeightPx = Math.max(
      minFieldHeight,
      usableHeight - awayBench.heightPx - gap
    );
    benchSpace = Math.max(0, usableHeight - fieldHeightPx - gap);
    awayBench = fitBenchInHeight(opts.awayBenchCount, benchSpace, LINEUP_BENCH);
  }

  return {
    fieldWidthPx: 0,
    fieldHeightPx: 0,
    chipScale: 1,
    fieldExplicit: false,
    awayBench,
    homeBench: EMPTY_BENCH,
  };
}

/**
 * Modal MVP: contenido primero; campo reducido (~20 %) si hace falta para encajar todo.
 */
function computeMvpLayout(opts: ComputeFitFieldModalLayoutOptions): FitFieldModalLayout {
  const gap = opts.gapPx ?? 3;
  const formationRowPx = opts.formationRowPx ?? 18;
  const formationBlockPx = formationRowPx * 2 + gap;
  const usableWidth = Math.max(0, opts.widthPx);
  const usableHeight = Math.max(
    0,
    opts.heightPx - opts.footerPx - formationBlockPx - gap * 3
  );

  let rowHeight = MVP_BENCH.rowHeight;
  let nameFont = MVP_BENCH.nameFont;
  let numberFont = MVP_BENCH.numberFont;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const awayBench = benchConfig(opts.awayBenchCount, rowHeight, nameFont, numberFont);
    const homeBench = benchConfig(opts.homeBenchCount, rowHeight, nameFont, numberFont);
    const benchHeight = awayBench.heightPx + homeBench.heightPx;
    const fieldByHeight = Math.max(0, usableHeight - benchHeight);
    const fieldByWidth = usableWidth / PITCH_ASPECT;
    const maxFieldHeight = Math.min(fieldByHeight, fieldByWidth);
    const fieldHeightPx = maxFieldHeight * MVP_FIELD_SCALE;
    const fieldWidthPx = fieldHeightPx * PITCH_ASPECT;
    const chipScale = Math.min(1, Math.max(0.52, fieldHeightPx / 300));

    const total = benchHeight + fieldHeightPx;
    if (total <= usableHeight + 0.5 || attempt === 9) {
      return {
        fieldWidthPx,
        fieldHeightPx,
        chipScale,
        fieldExplicit: true,
        awayBench,
        homeBench,
      };
    }

    rowHeight = Math.max(MVP_BENCH.minRowHeight, rowHeight - 2);
    nameFont = Math.max(MVP_BENCH.minNameFont, nameFont - 0.5);
    numberFont = Math.max(MVP_BENCH.minNumberFont, numberFont - 0.5);
  }

  const awayBench = benchConfig(
    opts.awayBenchCount,
    MVP_BENCH.minRowHeight,
    MVP_BENCH.minNameFont,
    MVP_BENCH.minNumberFont
  );
  const homeBench = benchConfig(
    opts.homeBenchCount,
    MVP_BENCH.minRowHeight,
    MVP_BENCH.minNameFont,
    MVP_BENCH.minNumberFont
  );
  const benchHeight = awayBench.heightPx + homeBench.heightPx;
  const fieldHeightPx = Math.max(0, usableHeight - benchHeight) * MVP_FIELD_SCALE;

  return {
    fieldWidthPx: fieldHeightPx * PITCH_ASPECT,
    fieldHeightPx,
    chipScale: 0.52,
    fieldExplicit: true,
    awayBench,
    homeBench,
  };
}

export function computeFitFieldModalLayout(
  opts: ComputeFitFieldModalLayoutOptions
): FitFieldModalLayout {
  const mode = opts.mode ?? "lineup";
  return mode === "mvp" ? computeMvpLayout(opts) : computeLineupLayout(opts);
}
