/** Proporción ancho:alto del terreno vertical (~68×105 m). */
export const VERTICAL_PITCH_ASPECT = 68 / 105;

export type { BenchLayoutConfig } from "./bench-grid-layout";
export { EMPTY_BENCH, pickBenchGrid } from "./bench-grid-layout";

import { pickBenchGrid } from "./bench-grid-layout";

export type FitLineupLayout = {
  bench: import("./bench-grid-layout").BenchLayoutConfig;
  fieldWidthPx: number;
  fieldHeightPx: number;
  metaPx: number;
};

export type ComputeFitLineupLayoutOptions = {
  widthPx: number;
  heightPx: number;
  benchCount: number;
  metaPx: number;
  gapPx?: number;
};

const LINEUP_BENCH = {
  rowHeight: 28,
  nameFont: 10,
  numberFont: 12,
  minRowHeight: 24,
  minNameFont: 9,
  minNumberFont: 11,
};

/** Campo vertical: 65–75 % del área útil. */
const FIELD_HEIGHT_MIN_RATIO = 0.65;
const FIELD_HEIGHT_TARGET_RATIO = 0.68;
const FIELD_HEIGHT_MAX_RATIO = 0.75;

/**
 * Alineación vertical: el campo manda (~68 %); convocatoria en 2–3 filas arriba.
 */
export function computeFitLineupLayout(opts: ComputeFitLineupLayoutOptions): FitLineupLayout {
  const gap = opts.gapPx ?? 4;
  const usableWidth = Math.max(0, opts.widthPx);
  const usableHeight = Math.max(0, opts.heightPx - opts.metaPx - gap);

  const naturalFieldHeight = usableWidth / VERTICAL_PITCH_ASPECT;
  let fieldHeightPx = Math.min(
    naturalFieldHeight,
    usableHeight * FIELD_HEIGHT_TARGET_RATIO
  );
  fieldHeightPx = Math.max(
    usableHeight * FIELD_HEIGHT_MIN_RATIO,
    Math.min(fieldHeightPx, usableHeight * FIELD_HEIGHT_MAX_RATIO)
  );

  let benchSpace = Math.max(0, usableHeight - fieldHeightPx - gap);
  let bench = pickBenchGrid(opts.benchCount, benchSpace, LINEUP_BENCH, {
    minRows: opts.benchCount >= 8 ? 2 : 1,
    maxRows: 4,
    maxColumns: 10,
  });

  if (bench.heightPx > benchSpace + 0.5 && opts.benchCount > 0) {
    fieldHeightPx = Math.max(
      usableHeight * FIELD_HEIGHT_MIN_RATIO,
      usableHeight - bench.heightPx - gap
    );
    benchSpace = Math.max(0, usableHeight - fieldHeightPx - gap);
    bench = pickBenchGrid(opts.benchCount, benchSpace, LINEUP_BENCH, {
      minRows: opts.benchCount >= 8 ? 2 : 1,
      maxRows: 4,
      maxColumns: 10,
    });
  }

  const fieldWidthPx = Math.min(usableWidth, fieldHeightPx * VERTICAL_PITCH_ASPECT);

  const totalUsed = bench.heightPx + fieldHeightPx + gap;
  if (totalUsed > usableHeight + 0.5 && opts.benchCount > 0) {
    fieldHeightPx = Math.max(120, usableHeight - bench.heightPx - gap);
  }

  return {
    bench,
    fieldWidthPx: Math.min(usableWidth, fieldHeightPx * VERTICAL_PITCH_ASPECT),
    fieldHeightPx,
    metaPx: opts.metaPx,
  };
}
