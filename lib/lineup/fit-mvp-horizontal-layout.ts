/** Proporción ancho:alto del terreno horizontal (~105×68 m). */
export const HORIZONTAL_PITCH_ASPECT = 105 / 68;

export type { BenchLayoutConfig } from "./bench-grid-layout";
export { EMPTY_BENCH, pickBenchGrid } from "./bench-grid-layout";

import { computeMvpFieldChipScale } from "./mvp-field-chip-scale";
import type { BenchLayoutConfig } from "./bench-grid-layout";
import { EMPTY_BENCH } from "./bench-grid-layout";

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

const FORMATION_ROW_PX = 22;

const MVP_BENCH_INLINE = {
  fontPx: 10,
  lineHeightPx: 11,
  lineGapPx: 0,
  /** Ancho medio de "12 Apellido, " en px con font 10. */
  avgPlayerPx: 58,
};

/** Altura estimada de la lista inline "2 Apellido, 5 Apellido…" a ancho del campo. */
export function estimateMvpInlineBenchLayout(
  count: number,
  fieldWidthPx: number
): BenchLayoutConfig {
  if (count <= 0) return EMPTY_BENCH;

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

/**
 * MVP horizontal: visitante (izq. en campo) arriba, campo en el centro, local (der.) abajo.
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

  const maxBenchHeight = Math.min(usableHeight * 0.22, 80);
  const awayBenchEstimate = estimateMvpInlineBenchLayout(
    opts.awayBenchCount,
    estFieldWidth
  );
  const homeBenchEstimate = estimateMvpInlineBenchLayout(
    opts.homeBenchCount,
    estFieldWidth
  );
  const benchStackHeight = Math.min(
    maxBenchHeight * 2,
    awayBenchEstimate.heightPx + homeBenchEstimate.heightPx
  );

  const fieldByHeight = Math.max(0, usableHeight - benchStackHeight);
  const fieldByWidth = usableWidth / HORIZONTAL_PITCH_ASPECT;
  const fieldHeightPx = Math.min(fieldByHeight, fieldByWidth);
  const fieldWidthPx = fieldHeightPx * HORIZONTAL_PITCH_ASPECT;

  const awayBenchFinal = estimateMvpInlineBenchLayout(opts.awayBenchCount, fieldWidthPx);
  const homeBenchFinal = estimateMvpInlineBenchLayout(opts.homeBenchCount, fieldWidthPx);

  return {
    fieldWidthPx,
    fieldHeightPx,
    chipScale: computeMvpFieldChipScale(fieldWidthPx, fieldHeightPx),
    awayBench: awayBenchFinal,
    homeBench: homeBenchFinal,
  };
}
