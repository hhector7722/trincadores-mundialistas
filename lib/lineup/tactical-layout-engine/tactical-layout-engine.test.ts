import { expect, test, describe } from "vitest";
import { LayoutEngine } from "./engine";
import { LayoutConstraints, LayoutElementInput } from "./types";

describe("Tactical Layout Engine", () => {
  const baseConstraints: LayoutConstraints = {
    margins: { side: 5, vertical: 5 },
    spacing: { minHorizontal: 5, minVertical: 8 },
    chipSize: { minScale: 0.5, maxScale: 1.5, baseWidth: 10, baseHeight: 12 },
    nameAreaBounds: { width: 12, height: 4 },
    optimization: { mode: "balanced", maxIterations: 50, tolerance: 0.05 },
    fieldBounds: { xMin: 0, xMax: 100, yMin: 0, yMax: 100, isAwayHalf: false },
  };

  test("Generates deterministic layout for 4-4-2", () => {
    const inputs: LayoutElementInput[] = [
      { id: "gk", role: "GK", referenceX: 50, referenceY: 96 },
      { id: "lb", role: "DF", referenceX: 10, referenceY: 79 },
      { id: "lcb", role: "DF", referenceX: 30, referenceY: 79 },
      { id: "rcb", role: "DF", referenceX: 70, referenceY: 79 },
      { id: "rb", role: "DF", referenceX: 90, referenceY: 79 },
      { id: "lm", role: "MF", referenceX: 10, referenceY: 44 },
      { id: "lcm", role: "MF", referenceX: 30, referenceY: 44 },
      { id: "rcm", role: "MF", referenceX: 70, referenceY: 44 },
      { id: "rm", role: "MF", referenceX: 90, referenceY: 44 },
      { id: "st1", role: "FW", referenceX: 35, referenceY: 9 },
      { id: "st2", role: "FW", referenceX: 65, referenceY: 9 },
    ];

    const result1 = LayoutEngine.calculate(inputs, baseConstraints);
    const result2 = LayoutEngine.calculate(inputs, baseConstraints);

    // Determinismo
    expect(result1.positions).toEqual(result2.positions);
    expect(result1.chipScale).toEqual(result2.chipScale);

    // Bandas detectadas (deberían ser 4)
    expect(result1.bands.length).toBe(4);
    
    // Todos dentro del campo (0-100)
    result1.positions.forEach(pos => {
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.x).toBeLessThanOrEqual(100);
      expect(pos.y).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeLessThanOrEqual(100);
    });
  });

  test("Handles empty inputs gracefully", () => {
    const result = LayoutEngine.calculate([], baseConstraints);
    expect(result.positions).toEqual([]);
    expect(result.bands).toEqual([]);
  });
});
