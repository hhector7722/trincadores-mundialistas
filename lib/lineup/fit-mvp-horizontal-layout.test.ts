import { describe, expect, it } from "vitest";
import { pickBenchGrid } from "./bench-grid-layout";
import {
  computeFitMvpHorizontalLayout,
  HORIZONTAL_PITCH_ASPECT,
} from "./fit-mvp-horizontal-layout";

describe("computeFitMvpHorizontalLayout", () => {
  it("distribuye convocatorias en varias filas", () => {
    const layout = computeFitMvpHorizontalLayout({
      widthPx: 400,
      heightPx: 640,
      awayBenchCount: 12,
      homeBenchCount: 12,
      footerPx: 56,
      headerPx: 20,
      gapPx: 4,
    });

    expect(layout.awayBench.rows).toBeGreaterThanOrEqual(2);
    expect(layout.homeBench.rows).toBeGreaterThanOrEqual(2);
    expect(layout.fieldWidthPx).toBeCloseTo(layout.fieldHeightPx * HORIZONTAL_PITCH_ASPECT, 1);
  });

  it("reduce escala de fichas para evitar solapamientos", () => {
    const layout = computeFitMvpHorizontalLayout({
      widthPx: 360,
      heightPx: 520,
      awayBenchCount: 15,
      homeBenchCount: 14,
      footerPx: 56,
      headerPx: 20,
      gapPx: 4,
    });

    expect(layout.chipScale).toBeLessThanOrEqual(0.62);
    expect(layout.chipScale).toBeGreaterThanOrEqual(0.38);
  });

  it("encaja todo en viewports bajos sin scroll", () => {
    const heightPx = 520;
    const footerPx = 56;
    const headerPx = 20;
    const gapPx = 4;
    const layout = computeFitMvpHorizontalLayout({
      widthPx: 360,
      heightPx,
      awayBenchCount: 15,
      homeBenchCount: 14,
      footerPx,
      headerPx,
      gapPx,
    });

    const benchHeight = Math.max(layout.awayBench.heightPx, layout.homeBench.heightPx);
    const total =
      benchHeight + layout.fieldHeightPx + footerPx + headerPx + gapPx * 3;

    expect(total).toBeLessThanOrEqual(heightPx + 2);
  });
});

describe("pickBenchGrid MVP", () => {
  it("limita columnas en columnas estrechas", () => {
    const grid = pickBenchGrid(
      12,
      72,
      {
        rowHeight: 24,
        nameFont: 9,
        numberFont: 10,
        minRowHeight: 22,
        minNameFont: 8,
        minNumberFont: 9,
      },
      { minRows: 2, maxRows: 3, maxColumns: 6 }
    );

    expect(grid.rows).toBeGreaterThanOrEqual(2);
    expect(grid.columns).toBeLessThanOrEqual(6);
  });
});
