import { describe, test, expect } from "vitest";
import { LayoutEngine } from "./engine";
import { LayoutConstraints, LayoutElementInput, LayoutPosition } from "./types";

const CONSTRAINTS: LayoutConstraints = {
  margins: { side: 2, vertical: 2 },
  spacing: { minHorizontal: 2, minVertical: 2 },
  chipSize: { minScale: 0.3, maxScale: 1.5, baseWidth: 10, baseHeight: 10 },
  nameAreaBounds: { width: 12, height: 4 },
  optimization: { mode: "balanced", maxIterations: 50, tolerance: 0.05 },
  fieldBounds: { xMin: 0, xMax: 100, yMin: 50, yMax: 100, isAwayHalf: false },
};

function generateRandomPlayers(count: number): LayoutElementInput[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: `R${i}`,
    role: "FW",
    referenceX: Math.random() * 100,
    referenceY: 50 + Math.random() * 50
  }));
}

function verifyInvariants(positions: LayoutPosition[], scale: number, constraints: LayoutConstraints, shouldHaveZeroOverlaps: boolean) {
  const chipW = constraints.chipSize.baseWidth * scale;
  const chipH = constraints.chipSize.baseHeight * scale;
  const textH = constraints.nameAreaBounds.height * scale;
  const totalH = chipH + textH;

  const b = constraints.fieldBounds!;

  for (let i = 0; i < positions.length; i++) {
    const p1 = positions[i];
    
    // Bounds invariant
    const minX = p1.x - (chipW / 2) - constraints.margins.side;
    const maxX = p1.x + (chipW / 2) + constraints.margins.side;
    const minY = p1.y - (chipH / 2) - constraints.margins.vertical; 
    const maxY = p1.y + (chipH / 2) + textH + constraints.margins.vertical;

    expect(minX).toBeGreaterThanOrEqual(b.xMin - 0.01);
    expect(maxX).toBeLessThanOrEqual(b.xMax + 0.01);
    expect(minY).toBeGreaterThanOrEqual(b.yMin - 0.01);
    expect(maxY).toBeLessThanOrEqual(b.yMax + 0.01);

    // Collision invariant
    if (shouldHaveZeroOverlaps) {
      for (let j = i + 1; j < positions.length; j++) {
        const p2 = positions[j];
        const dx = Math.abs(p1.x - p2.x);
        const dy = Math.abs(p1.y - p2.y);
        
        const overlap = dx < (chipW - 0.1) && dy < (totalH - 0.1);
        expect(overlap).toBe(false);
      }
    }
  }
}

describe("Tactical Layout Engine - Property & Edge Cases", () => {
  test("Property-based testing: random coordinates inside field bounds generate valid layouts", () => {
    for (let run = 0; run < 20; run++) {
      const inputs = generateRandomPlayers(11);
      const result = LayoutEngine.calculate(inputs, CONSTRAINTS);
      const expectedZero = result.metrics.stopReason === "zero-collisions" || result.metrics.stopReason === "settled";
      verifyInvariants(result.positions, result.chipScale, CONSTRAINTS, expectedZero);
    }
  });

  test("Edge case: all players in identical coordinates", () => {
    const inputs = Array.from({ length: 11 }).map((_, i) => ({
      id: `C${i}`,
      role: "DF",
      referenceX: 50,
      referenceY: 75
    }));
    
    const result = LayoutEngine.calculate(inputs, CONSTRAINTS);
    // Identical coords will be pushed apart, zero collisions expected
    verifyInvariants(result.positions, result.chipScale, CONSTRAINTS, true);
  });

  test("Edge case: partial or missing coordinates (handled as 50,50 defaults externally, but testing extreme 0,0)", () => {
    const inputs = Array.from({ length: 11 }).map((_, i) => ({
      id: `C${i}`,
      role: "DF",
      referenceX: 0,
      referenceY: 0 // Deep into rival half, should be clamped
    }));
    
    const result = LayoutEngine.calculate(inputs, CONSTRAINTS);
    verifyInvariants(result.positions, result.chipScale, CONSTRAINTS, true);
  });

  test("Edge case: tiny screen (minimized field bounds)", () => {
    const inputs = generateRandomPlayers(11);
    const tightConstraints = {
      ...CONSTRAINTS,
      fieldBounds: { xMin: 40, xMax: 60, yMin: 40, yMax: 60, isAwayHalf: false }
    };
    const result = LayoutEngine.calculate(inputs, tightConstraints);
    
    // It should push scale down heavily to fit them
    expect(result.chipScale).toBeLessThan(0.8);
    // If field is too tiny, collisions might be inevitable at minScale.
    // We only verify boundaries, not 0 overlaps.
    verifyInvariants(result.positions, result.chipScale, tightConstraints, false);
  });
});
