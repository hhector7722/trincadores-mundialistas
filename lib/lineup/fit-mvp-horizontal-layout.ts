import { scaleModalFieldContainer } from "./modal-field-scale";

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
  /** Dimensiones de referencia (sin escala de contenedor) para calcular tamaño de fichas. */
  chipReferenceWidthPx: number;
  chipReferenceHeightPx: number;
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
  lineHeightPx: 14,
  lineGapPx: 2,
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
  const naturalFieldHeightPx = Math.min(fieldByHeight, fieldByWidth);
  const naturalFieldWidthPx = naturalFieldHeightPx * HORIZONTAL_PITCH_ASPECT;
  const scaledField = scaleModalFieldContainer(naturalFieldWidthPx, naturalFieldHeightPx);

  const awayBenchFinal = estimateMvpInlineBenchLayout(
    opts.awayBenchCount,
    scaledField.widthPx
  );
  const homeBenchFinal = estimateMvpInlineBenchLayout(
    opts.homeBenchCount,
    scaledField.widthPx
  );

  return {
    fieldWidthPx: scaledField.widthPx,
    fieldHeightPx: scaledField.heightPx,
    chipReferenceWidthPx: scaledField.referenceWidthPx,
    chipReferenceHeightPx: scaledField.referenceHeightPx,
    chipScale: computeMvpFieldChipScale(
      scaledField.referenceWidthPx,
      scaledField.referenceHeightPx
    ),
    awayBench: awayBenchFinal,
    homeBench: homeBenchFinal,
  };
}
