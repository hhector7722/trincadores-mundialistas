import { describe, expect, it } from "vitest";
import { computeFitLineupLayout, VERTICAL_PITCH_ASPECT } from "./fit-lineup-layout";

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
    expect(layout.bench.nameFontPx).toBeGreaterThanOrEqual(9);
    expect(layout.bench.numberFontPx).toBeGreaterThanOrEqual(11);
    expect(layout.metaPx).toBe(56);
  });

  it("encaja banquillo en viewports bajos sin scroll", () => {
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

    const total = layout.bench.heightPx + metaPx + gapPx;
    expect(total).toBeLessThanOrEqual(heightPx + 1);
  });

  it("prioriza altura de campo vertical", () => {
    const layout = computeFitLineupLayout({
      widthPx: 320,
      heightPx: 600,
      benchCount: 12,
      metaPx: 56,
      gapPx: 4,
    });

    const usableHeight = 600 - 56 - 4;
    const fieldEstimate = usableHeight - layout.bench.heightPx - 4;
    expect(fieldEstimate / usableHeight).toBeGreaterThanOrEqual(0.55);
    expect(VERTICAL_PITCH_ASPECT).toBeCloseTo(68 / 105, 4);
  });
});
