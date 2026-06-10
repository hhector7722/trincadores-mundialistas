import { describe, expect, it } from "vitest";
import { computeFitFieldModalLayout, PITCH_ASPECT } from "./fit-field-modal-layout";

describe("computeFitFieldModalLayout — lineup", () => {
  it("prioriza el campo y calcula banquillo legible", () => {
    const layout = computeFitFieldModalLayout({
      widthPx: 360,
      heightPx: 640,
      awayBenchCount: 12,
      homeBenchCount: 0,
      footerPx: 52,
      gapPx: 4,
      mode: "lineup",
    });

    expect(layout.fieldExplicit).toBe(false);
    expect(layout.chipScale).toBe(1);
    expect(layout.awayBench.columns).toBeGreaterThan(0);
    expect(layout.awayBench.nameFontPx).toBeGreaterThanOrEqual(8);
    expect(layout.awayBench.numberFontPx).toBeGreaterThanOrEqual(10);
  });

  it("encaja banquillo en viewports bajos sin scroll", () => {
    const heightPx = 520;
    const footerPx = 52;
    const gapPx = 4;
    const layout = computeFitFieldModalLayout({
      widthPx: 320,
      heightPx,
      awayBenchCount: 15,
      homeBenchCount: 0,
      footerPx,
      gapPx,
      mode: "lineup",
    });

    const total = layout.awayBench.heightPx + footerPx + gapPx;
    expect(total).toBeLessThanOrEqual(heightPx + 1);
  });
});

describe("computeFitFieldModalLayout — mvp", () => {
  it("reduce el campo y mantiene proporción reglamentaria", () => {
    const layout = computeFitFieldModalLayout({
      widthPx: 360,
      heightPx: 640,
      awayBenchCount: 12,
      homeBenchCount: 12,
      footerPx: 52,
      gapPx: 3,
      mode: "mvp",
      formationRowPx: 18,
    });

    expect(layout.fieldExplicit).toBe(true);
    expect(layout.fieldWidthPx).toBeCloseTo(layout.fieldHeightPx * PITCH_ASPECT, 1);
    expect(layout.awayBench.columns).toBeGreaterThan(0);
    expect(layout.homeBench.columns).toBeGreaterThan(0);
  });

  it("encaja todo en viewports bajos sin depender de scroll", () => {
    const heightPx = 520;
    const footerPx = 52;
    const gapPx = 3;
    const formationRowPx = 18;
    const layout = computeFitFieldModalLayout({
      widthPx: 320,
      heightPx,
      awayBenchCount: 15,
      homeBenchCount: 14,
      footerPx,
      gapPx,
      mode: "mvp",
      formationRowPx,
    });

    const formationBlock = formationRowPx * 2 + gapPx;
    const total =
      layout.awayBench.heightPx +
      layout.homeBench.heightPx +
      layout.fieldHeightPx +
      footerPx +
      formationBlock +
      gapPx * 3;

    expect(total).toBeLessThanOrEqual(heightPx + 2);
    expect(layout.chipScale).toBeGreaterThanOrEqual(0.52);
  });

  it("aplica reducción del campo respecto al máximo teórico", () => {
    const layout = computeFitFieldModalLayout({
      widthPx: 400,
      heightPx: 700,
      awayBenchCount: 10,
      homeBenchCount: 10,
      footerPx: 52,
      gapPx: 3,
      mode: "mvp",
      formationRowPx: 18,
    });

    const maxFieldHeight = 400 / PITCH_ASPECT;
    expect(layout.fieldHeightPx).toBeLessThan(maxFieldHeight * 0.85);
  });
});
