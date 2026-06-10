/** Proporción ancho:alto del terreno horizontal (~105×68 m). */
export const HORIZONTAL_PITCH_ASPECT = 105 / 68;

export type { BenchLayoutConfig } from "./bench-grid-layout";
export { EMPTY_BENCH, pickBenchGrid } from "./bench-grid-layout";

import { pickBenchGrid } from "./bench-grid-layout";
import { computeMvpFieldChipScale } from "./mvp-field-chip-scale";

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
  /** Fila bandera · equipo · formación bajo el campo. */
  formationRowPx?: number;
  /** @deprecated Usar formationRowPx */
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

const FORMATION_ROW_PX = 22;
const BENCH_CELL_MIN_PX = 30;

/**
 * MVP horizontal: convocatoria local arriba, campo en el centro, visitante abajo.
 */
export function computeFitMvpHorizontalLayout(
  opts: ComputeFitMvpHorizontalLayoutOptions
): FitMvpHorizontalLayout {
  const gap = opts.gapPx ?? 4;
  const formationRowPx = opts.formationRowPx ?? opts.headerPx ?? FORMATION_ROW_PX;
  const usableWidth = Math.max(0, opts.widthPx);
  const usableHeight = Math.max(
    0,
    opts.heightPx - opts.footerPx - formationRowPx * 2 - gap * 3
  );

  const estFieldWidth = Math.min(
    usableWidth,
    usableHeight * HORIZONTAL_PITCH_ASPECT * 0.55
  );
  const maxColumnsPerSide = Math.max(
    4,
    Math.floor(estFieldWidth / BENCH_CELL_MIN_PX)
  );

  const maxBenchHeight = Math.min(usableHeight * 0.22, 80);
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

  const benchStackHeight = awayBench.heightPx + homeBench.heightPx;
  const fieldByHeight = Math.max(0, usableHeight - benchStackHeight);
  const fieldByWidth = usableWidth / HORIZONTAL_PITCH_ASPECT;
  const fieldHeightPx = Math.min(fieldByHeight, fieldByWidth);
  const fieldWidthPx = fieldHeightPx * HORIZONTAL_PITCH_ASPECT;

  const benchColumnsCap = Math.max(
    4,
    Math.floor(fieldWidthPx / BENCH_CELL_MIN_PX)
  );
  const awayBenchFinal =
    awayBench.columns > benchColumnsCap
      ? pickBenchGrid(opts.awayBenchCount, maxBenchHeight, MVP_BENCH, {
          minRows: opts.awayBenchCount >= 6 ? 2 : 1,
          maxRows: 3,
          maxColumns: benchColumnsCap,
        })
      : awayBench;
  const homeBenchFinal =
    homeBench.columns > benchColumnsCap
      ? pickBenchGrid(opts.homeBenchCount, maxBenchHeight, MVP_BENCH, {
          minRows: opts.homeBenchCount >= 6 ? 2 : 1,
          maxRows: 3,
          maxColumns: benchColumnsCap,
        })
      : homeBench;

  return {
    fieldWidthPx,
    fieldHeightPx,
    chipScale: computeMvpFieldChipScale(fieldWidthPx, fieldHeightPx),
    awayBench: awayBenchFinal,
    homeBench: homeBenchFinal,
  };
}
