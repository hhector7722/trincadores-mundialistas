import { describe, expect, it } from "vitest";
import {
  computeFitMvpHorizontalLayout,
  estimateMvpInlineBenchLayout,
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

    expect(layout.chipScale).toBeLessThanOrEqual(1.41);
    expect(layout.chipScale).toBeGreaterThanOrEqual(0.68);
  });

  it("encaja todo en viewports bajos sin scroll", () => {
    const heightPx = 520;
    const footerPx = 56;
    const formationRowPx = 22;
    const gapPx = 4;
    const layout = computeFitMvpHorizontalLayout({
      widthPx: 360,
      heightPx,
      awayBenchCount: 15,
      homeBenchCount: 14,
      footerPx,
      formationRowPx,
      gapPx,
    });

    const total =
      layout.homeBench.heightPx +
      layout.awayBench.heightPx +
      layout.fieldHeightPx +
      footerPx +
      formationRowPx * 2 +
      gapPx * 3;

    expect(total).toBeLessThanOrEqual(heightPx + 2);
  });
});

describe("estimateMvpInlineBenchLayout", () => {
  it("envuelve reservas en varias líneas según ancho del campo", () => {
    const layout = estimateMvpInlineBenchLayout(12, 360);
    expect(layout.rows).toBeGreaterThanOrEqual(2);
    expect(layout.nameFontPx).toBe(10);
  });
});