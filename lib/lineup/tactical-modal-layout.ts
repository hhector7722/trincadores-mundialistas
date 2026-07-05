/**
 * Configuración de rejilla simplificada para los suplentes.
 * El campo táctico se auto-mide en el cliente de forma dinámica.
 */

export type BenchLayoutConfig = {
  columns: number;
  rows: number;
  heightPx: number;
  rowHeightPx: number;
  nameFontPx: number;
  numberFontPx: number;
};

export type FitMvpHorizontalLayout = {
  homeBench: BenchLayoutConfig;
  awayBench: BenchLayoutConfig;
};

const MVP_BENCH_INLINE = {
  fontPx: 10,
  lineHeightPx: 11,
  lineGapPx: 0,
  avgPlayerPx: 58,
};

export function estimateMvpInlineBenchLayout(
  count: number,
  fieldWidthPx: number
): BenchLayoutConfig {
  if (count <= 0) {
    return {
      columns: 0,
      rows: 0,
      heightPx: 0,
      rowHeightPx: 0,
      nameFontPx: 0,
      numberFontPx: 0,
    };
  }

  const playersPerRow = Math.max(2, Math.floor(fieldWidthPx / MVP_BENCH_INLINE.avgPlayerPx));
  const rows = Math.ceil(count / playersPerRow);

  return {
    columns: playersPerRow,
    rows,
    heightPx:
      rows * MVP_BENCH_INLINE.lineHeightPx +
      Math.max(0, rows - 1) * MVP_BENCH_INLINE.lineGapPx,
    rowHeightPx: MVP_BENCH_INLINE.lineHeightPx,
    nameFontPx: MVP_BENCH_INLINE.fontPx,
    numberFontPx: MVP_BENCH_INLINE.fontPx,
  };
}

export const TACTICAL_MODAL_LAYOUT_WIDTH_PX = 480;
export const TACTICAL_SHELL_BENCH_PLACEHOLDER = 12;

export function buildTacticalModalLayout(
  homeBenchCount: number,
  awayBenchCount: number
): FitMvpHorizontalLayout {
  const home = homeBenchCount > 0 ? homeBenchCount : TACTICAL_SHELL_BENCH_PLACEHOLDER;
  const away = awayBenchCount > 0 ? awayBenchCount : TACTICAL_SHELL_BENCH_PLACEHOLDER;

  return {
    homeBench: estimateMvpInlineBenchLayout(home, TACTICAL_MODAL_LAYOUT_WIDTH_PX),
    awayBench: estimateMvpInlineBenchLayout(away, TACTICAL_MODAL_LAYOUT_WIDTH_PX),
  };
}
