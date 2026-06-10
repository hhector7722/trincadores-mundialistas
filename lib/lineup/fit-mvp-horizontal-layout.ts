/** Proporción ancho:alto del terreno horizontal (~105×68 m). */
export const HORIZONTAL_PITCH_ASPECT = 105 / 68;

export type BenchLayoutConfig = {
  columns: number;
  rows: number;
  heightPx: number;
  rowHeightPx: number;
  nameFontPx: number;
  numberFontPx: number;
};

export type FitMvpHorizontalLayout = {
  fieldWidthPx: number;
  fieldHeightPx: number;
  chipScale: number;
  awayBench: BenchLayoutConfig;
  homeBench: BenchLayoutConfig;
};

export type ComputeFitMvpHorizontalLayoutOptions = {
  widthPx: number;
  heightPx: number;
  awayBenchCount: number;
  homeBenchCount: number;
  footerPx: number;
  headerPx?: number;
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

const MVP_BENCH: BenchSizePrefs = {
  rowHeight: 26,
  nameFont: 9,
  numberFont: 11,
  minRowHeight: 22,
  minNameFont: 8,
  minNumberFont: 9,
};

function benchConfig(
  count: number,
  rowHeightPx: number,
  nameFontPx: number,
  numberFontPx: number
): BenchLayoutConfig {
  if (count <= 0) return EMPTY_BENCH;

  let best: BenchLayoutConfig | null = null;

  for (let rows = 1; rows <= Math.min(count, 5); rows += 1) {
    const columns = Math.ceil(count / rows);
    const heightPx = rows * rowHeightPx + Math.max(0, rows - 1) * BENCH_ROW_GAP;
    const candidate = { columns, rows, heightPx, rowHeightPx, nameFontPx, numberFontPx };
    if (!best || heightPx < best.heightPx) {
      best = candidate;
    }
  }

  return best ?? EMPTY_BENCH;
}

function fitBenchInColumn(
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
 * MVP horizontal: contenido primero (cabeceras + convocatorias + campo + botón).
 * Las reservas van en columnas paralelas; el campo ocupa el espacio central restante.
 */
export function computeFitMvpHorizontalLayout(
  opts: ComputeFitMvpHorizontalLayoutOptions
): FitMvpHorizontalLayout {
  const gap = opts.gapPx ?? 4;
  const headerPx = opts.headerPx ?? 20;
  const usableWidth = Math.max(0, opts.widthPx);
  const usableHeight = Math.max(
    0,
    opts.heightPx - opts.footerPx - headerPx - gap * 3
  );

  let benchAreaHeight = Math.min(usableHeight * 0.38, 96);
  let rowHeight = MVP_BENCH.rowHeight;
  let nameFont = MVP_BENCH.nameFont;
  let numberFont = MVP_BENCH.numberFont;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const awayBench = benchConfig(opts.awayBenchCount, rowHeight, nameFont, numberFont);
    const homeBench = benchConfig(opts.homeBenchCount, rowHeight, nameFont, numberFont);
    const benchHeight = Math.max(awayBench.heightPx, homeBench.heightPx);

    if (benchHeight > benchAreaHeight + 0.5 && attempt < 11) {
      rowHeight = Math.max(MVP_BENCH.minRowHeight, rowHeight - 2);
      nameFont = Math.max(MVP_BENCH.minNameFont, nameFont - 0.5);
      numberFont = Math.max(MVP_BENCH.minNumberFont, numberFont - 0.5);
      continue;
    }

    const fieldByHeight = Math.max(0, usableHeight - benchHeight - gap);
    const fieldByWidth = usableWidth / HORIZONTAL_PITCH_ASPECT;
    const fieldHeightPx = Math.min(fieldByHeight, fieldByWidth);
    const fieldWidthPx = fieldHeightPx * HORIZONTAL_PITCH_ASPECT;
    const chipScale = Math.min(1, Math.max(0.55, fieldHeightPx / 200));

    const total = benchHeight + fieldHeightPx;
    if (total <= usableHeight + 1 || attempt === 11) {
      return {
        fieldWidthPx,
        fieldHeightPx,
        chipScale,
        awayBench: fitBenchInColumn(opts.awayBenchCount, benchHeight, {
          ...MVP_BENCH,
          rowHeight,
          nameFont,
          numberFont,
        }),
        homeBench: fitBenchInColumn(opts.homeBenchCount, benchHeight, {
          ...MVP_BENCH,
          rowHeight,
          nameFont,
          numberFont,
        }),
      };
    }

    benchAreaHeight = Math.max(benchHeight, benchAreaHeight - 4);
  }

  const awayBench = fitBenchInColumn(opts.awayBenchCount, 72, MVP_BENCH);
  const homeBench = fitBenchInColumn(opts.homeBenchCount, 72, MVP_BENCH);
  const benchHeight = Math.max(awayBench.heightPx, homeBench.heightPx);
  const fieldHeightPx = Math.max(0, usableHeight - benchHeight - gap);

  return {
    fieldWidthPx: Math.min(usableWidth, fieldHeightPx * HORIZONTAL_PITCH_ASPECT),
    fieldHeightPx,
    chipScale: 0.55,
    awayBench,
    homeBench,
  };
}
