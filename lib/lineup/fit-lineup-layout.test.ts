import { describe, expect, it } from "vitest";
import { pickBenchGrid } from "./bench-grid-layout";
import { computeFitLineupLayout, VERTICAL_PITCH_ASPECT } from "./fit-lineup-layout";

describe("pickBenchGrid", () => {
  it("prefiere varias filas frente a una sola fila larga", () => {
    const grid = pickBenchGrid(
      12,
      80,
      {
        rowHeight: 28,
        nameFont: 10,
        numberFont: 12,
        minRowHeight: 24,
        minNameFont: 9,
        minNumberFont: 11,
      },
      { minRows: 2, maxRows: 4, maxColumns: 10 }
    );

    expect(grid.rows).toBeGreaterThanOrEqual(2);
    expect(grid.columns).toBeLessThan(12);
  });
});

describe("computeFitLineupLayout", () => {
  it("reserva espacio para meta y calcula banquillo legible", () => {
    const layout = computeFitLineupLayout({
      widthPx: 360,
      heightPx: 640,
      benchCount: 12,
      metaPx: 56,
      gapPx: 4,
    });

    expect(layout.bench.columns).toBeGreaterThan(0);
    expect(layout.bench.rows).toBeGreaterThanOrEqual(2);
    expect(layout.bench.nameFontPx).toBeGreaterThanOrEqual(9);
    expect(layout.fieldHeightPx).toBeGreaterThan(0);
    expect(layout.fieldWidthPx).toBeCloseTo(layout.fieldHeightPx * VERTICAL_PITCH_ASPECT, 1);
  });

  it("encaja banquillo, campo y meta sin scroll", () => {
    const heightPx = 520;
    const metaPx = 56;
    const gapPx = 4;
    const layout = computeFitLineupLayout({
      widthPx: 320,
      heightPx,
      benchCount: 15,
      metaPx,
      gapPx,
    });

    const usableHeight = heightPx - metaPx - gapPx;
    const total = layout.bench.heightPx + layout.fieldHeightPx + metaPx + gapPx * 2;

    expect(total).toBeLessThanOrEqual(heightPx + 2);
    expect(layout.fieldHeightPx / usableHeight).toBeGreaterThanOrEqual(0.65);
  });
});
