/** Proporción ancho:alto del terreno horizontal (~105×68 m). */
export const HORIZONTAL_PITCH_ASPECT = 105 / 68;

export type { BenchLayoutConfig } from "./bench-grid-layout";
export { EMPTY_BENCH, pickBenchGrid } from "./bench-grid-layout";

import { pickBenchGrid } from "./bench-grid-layout";

export type FitMvpHorizontalLayout = {
  fieldWidthPx: number;
  fieldHeightPx: number;
  chipScale: number;
  awayBench: import("./bench-grid-layout").BenchLayoutConfig;
  homeBench: import("./bench-grid-layout").BenchLayoutConfig;
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

const MVP_BENCH = {
  rowHeight: 24,
  nameFont: 9,
  numberFont: 10,
  minRowHeight: 22,
  minNameFont: 8,
  minNumberFont: 9,
};

/** Escala visual de fichas MVP (solo tamaño, no coordenadas). */
function mvpChipScale(fieldHeightPx: number, fieldWidthPx: number): number {
  const byHeight = fieldHeightPx / 420;
  const byWidth = fieldWidthPx / 680;
  return Math.min(0.62, Math.max(0.38, Math.min(byHeight, byWidth)));
}

/**
 * MVP horizontal: convocatorias en 2–3 filas + campo + botón, sin scroll.
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

  const maxBenchHeight = Math.min(usableHeight * 0.32, 88);
  const maxColumnsPerSide = Math.max(4, Math.floor(usableWidth / 2 / 36));

  const awayBench = pickBenchGrid(opts.awayBenchCount, maxBenchHeight, MVP_BENCH, {
    minRows: opts.awayBenchCount >= 6 ? 2 : 1,
    maxRows: 3,
    maxColumns: maxColumnsPerSide,
  });
  const homeBench = pickBenchGrid(opts.homeBenchCount, maxBenchHeight, MVP_BENCH, {
    minRows: opts.homeBenchCount >= 6 ? 2 : 1,
    maxRows: 3,
    maxColumns: maxColumnsPerSide,
  });

  const benchHeight = Math.max(awayBench.heightPx, homeBench.heightPx);
  const fieldByHeight = Math.max(0, usableHeight - benchHeight - gap);
  const fieldByWidth = usableWidth / HORIZONTAL_PITCH_ASPECT;
  const fieldHeightPx = Math.min(fieldByHeight, fieldByWidth);
  const fieldWidthPx = fieldHeightPx * HORIZONTAL_PITCH_ASPECT;

  return {
    fieldWidthPx,
    fieldHeightPx,
    chipScale: mvpChipScale(fieldHeightPx, fieldWidthPx),
    awayBench,
    homeBench,
  };
}
