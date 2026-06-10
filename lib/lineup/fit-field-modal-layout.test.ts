import { describe, expect, it } from "vitest";
import { computeFitLineupLayout } from "./fit-lineup-layout";

/** Compatibilidad con tests legacy del módulo unificado. */
describe("fit-field-modal-layout (legacy reexport)", () => {
  it("modo lineup delega en computeFitLineupLayout", () => {
    const layout = computeFitLineupLayout({
      widthPx: 360,
      heightPx: 640,
      benchCount: 12,
      metaPx: 56,
      gapPx: 4,
    });

    expect(layout.bench.columns).toBeGreaterThan(0);
  });
});
