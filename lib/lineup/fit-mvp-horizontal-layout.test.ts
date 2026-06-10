import { describe, expect, it } from "vitest";
import {
  computeFitMvpHorizontalLayout,
  HORIZONTAL_PITCH_ASPECT,
} from "./fit-mvp-horizontal-layout";

describe("computeFitMvpHorizontalLayout", () => {
  it("mantiene proporción horizontal del terreno", () => {
    const layout = computeFitMvpHorizontalLayout({
      widthPx: 400,
      heightPx: 640,
      awayBenchCount: 12,
      homeBenchCount: 12,
      footerPx: 56,
      headerPx: 20,
      gapPx: 4,
    });

    expect(layout.fieldWidthPx).toBeCloseTo(layout.fieldHeightPx * HORIZONTAL_PITCH_ASPECT, 1);
    expect(layout.awayBench.columns).toBeGreaterThan(0);
    expect(layout.homeBench.columns).toBeGreaterThan(0);
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
    expect(layout.chipScale).toBeGreaterThanOrEqual(0.55);
  });
});
