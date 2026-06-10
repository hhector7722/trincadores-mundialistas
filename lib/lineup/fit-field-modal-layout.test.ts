import { describe, expect, it } from "vitest";
import { computeFitFieldModalLayout, PITCH_ASPECT } from "./fit-field-modal-layout";

describe("computeFitFieldModalLayout", () => {
  it("prioriza el campo y mantiene proporción reglamentaria", () => {
    const layout = computeFitFieldModalLayout({
      widthPx: 360,
      heightPx: 640,
      awayBenchCount: 12,
      homeBenchCount: 12,
      footerPx: 48,
      gapPx: 4,
    });

    expect(layout.fieldWidthPx).toBeCloseTo(layout.fieldHeightPx * PITCH_ASPECT, 1);
    expect(layout.fieldHeightPx).toBeGreaterThan(180);
    expect(layout.awayBench.columns).toBeGreaterThan(0);
    expect(layout.homeBench.columns).toBeGreaterThan(0);
  });

  it("encaja todo en viewports bajos sin depender de scroll", () => {
    const heightPx = 520;
    const footerPx = 44;
    const gapPx = 2;
    const layout = computeFitFieldModalLayout({
      widthPx: 320,
      heightPx,
      awayBenchCount: 15,
      homeBenchCount: 14,
      footerPx,
      gapPx,
    });

    const total =
      layout.awayBench.heightPx +
      layout.homeBench.heightPx +
      layout.fieldHeightPx +
      footerPx +
      gapPx * 2;

    expect(total).toBeLessThanOrEqual(heightPx + 1);
    expect(layout.chipScale).toBe(1);
  });
});
