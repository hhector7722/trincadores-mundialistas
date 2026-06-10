/** Proporción ancho:alto del terreno reglamentario (~68×105 m). */
export const PITCH_ASPECT = 68 / 105;

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
};

export type ComputeFitFieldModalLayoutOptions = {
  widthPx: number;
  heightPx: number;
  awayBenchCount: number;
  homeBenchCount: number;
  footerPx: number;
  /** Espacio entre bloques (campo ↔ banquillos). */
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

function benchConfig(count: number, rowHeightPx: number, nameFontPx: number, numberFontPx: number): BenchLayoutConfig {
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

/**
 * Reparte el espacio del modal: banquillos compactos + campo dominante, sin scroll.
 * Reduce tipografías y escala de fichas si el viewport es estrecho.
 */
export function computeFitFieldModalLayout(
  opts: ComputeFitFieldModalLayoutOptions
): FitFieldModalLayout {
  const gap = opts.gapPx ?? 2;
  const usableHeight = Math.max(0, opts.heightPx - opts.footerPx - gap * 2);
  const usableWidth = Math.max(0, opts.widthPx);

  let rowHeight = 26;
  let nameFont = 8;
  let numberFont = 10;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const awayBench = benchConfig(opts.awayBenchCount, rowHeight, nameFont, numberFont);
    const homeBench = benchConfig(opts.homeBenchCount, rowHeight, nameFont, numberFont);
    const benchHeight = awayBench.heightPx + homeBench.heightPx;
    const fieldByHeight = Math.max(0, usableHeight - benchHeight);
    const fieldByWidth = usableWidth / PITCH_ASPECT;
    const fieldHeightPx = Math.min(fieldByHeight, fieldByWidth);
    const fieldWidthPx = fieldHeightPx * PITCH_ASPECT;
    const chipScale = Math.min(1, Math.max(0.58, fieldHeightPx / 270));

    const total = benchHeight + fieldHeightPx;
    if (total <= usableHeight + 0.5 || attempt === 7) {
      return {
        fieldWidthPx: fieldWidthPx,
        fieldHeightPx: fieldHeightPx,
        chipScale,
        awayBench,
        homeBench,
      };
    }

    rowHeight = Math.max(20, rowHeight - 2);
    nameFont = Math.max(7, nameFont - 0.5);
    numberFont = Math.max(8, numberFont - 0.5);
  }

  return {
    fieldWidthPx: usableWidth,
    fieldHeightPx: usableWidth / PITCH_ASPECT,
    chipScale: 0.58,
    awayBench: benchConfig(opts.awayBenchCount, 20, 7, 8),
    homeBench: benchConfig(opts.homeBenchCount, 20, 7, 8),
  };
}
