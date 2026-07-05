import { expect, test, describe } from "vitest";
import { LayoutEngine } from "./engine";
import { LayoutConstraints, LayoutElementInput } from "./types";

const TEST_CONSTRAINTS: LayoutConstraints = {
  margins: { side: 2, vertical: 2 },
  spacing: { minHorizontal: 2, minVertical: 2 },
  chipSize: { minScale: 0.3, maxScale: 1.5, baseWidth: 10, baseHeight: 10 },
  nameAreaBounds: { width: 12, height: 4 },
  optimization: { mode: "balanced", maxIterations: 50, tolerance: 0.05 },
  fieldBounds: { xMin: 0, xMax: 100, yMin: 0, yMax: 100, isAwayHalf: false },
};

function createFormation(formation: string): LayoutElementInput[] {
  // A mock 4-3-3
  if (formation === "4-3-3") {
    return [
      { id: "GK", role: "GK", referenceX: 50, referenceY: 90 },
      { id: "LB", role: "LB", referenceX: 10, referenceY: 70 },
      { id: "CB1", role: "CB", referenceX: 35, referenceY: 70 },
      { id: "CB2", role: "CB", referenceX: 65, referenceY: 70 },
      { id: "RB", role: "RB", referenceX: 90, referenceY: 70 },
      { id: "CM1", role: "CM", referenceX: 25, referenceY: 45 },
      { id: "CM2", role: "CM", referenceX: 50, referenceY: 45 },
      { id: "CM3", role: "CM", referenceX: 75, referenceY: 45 },
      { id: "LW", role: "LW", referenceX: 15, referenceY: 20 },
      { id: "ST", role: "ST", referenceX: 50, referenceY: 20 },
      { id: "RW", role: "RW", referenceX: 85, referenceY: 20 },
    ];
  }
  // 4-4-2
  if (formation === "4-4-2") {
    return [
      { id: "GK", role: "GK", referenceX: 50, referenceY: 90 },
      { id: "LB", role: "LB", referenceX: 10, referenceY: 70 },
      { id: "CB1", role: "CB", referenceX: 35, referenceY: 70 },
      { id: "CB2", role: "CB", referenceX: 65, referenceY: 70 },
      { id: "RB", role: "RB", referenceX: 90, referenceY: 70 },
      { id: "LM", role: "LM", referenceX: 15, referenceY: 45 },
      { id: "CM1", role: "CM", referenceX: 35, referenceY: 45 },
      { id: "CM2", role: "CM", referenceX: 65, referenceY: 45 },
      { id: "RM", role: "RM", referenceX: 85, referenceY: 45 },
      { id: "ST1", role: "ST", referenceX: 35, referenceY: 20 },
      { id: "ST2", role: "ST", referenceX: 65, referenceY: 20 },
    ];
  }
  if (formation === "3-5-2") {
    return [
      { id: "GK", role: "GK", referenceX: 50, referenceY: 90 },
      { id: "CB1", role: "CB", referenceX: 25, referenceY: 70 },
      { id: "CB2", role: "CB", referenceX: 50, referenceY: 70 },
      { id: "CB3", role: "CB", referenceX: 75, referenceY: 70 },
      { id: "LWB", role: "LWB", referenceX: 10, referenceY: 55 },
      { id: "CM1", role: "CM", referenceX: 35, referenceY: 45 },
      { id: "CDM", role: "CDM", referenceX: 50, referenceY: 55 },
      { id: "CM2", role: "CM", referenceX: 65, referenceY: 45 },
      { id: "RWB", role: "RWB", referenceX: 90, referenceY: 55 },
      { id: "ST1", role: "ST", referenceX: 35, referenceY: 20 },
      { id: "ST2", role: "ST", referenceX: 65, referenceY: 20 },
    ];
  }
  return [];
}

describe("Tactical Layout Engine", () => {
  test("Determinismo: misma entrada produce mismo layout siempre", () => {
    const inputs = createFormation("4-3-3");
    const result1 = LayoutEngine.calculate(inputs, TEST_CONSTRAINTS);
    const result2 = LayoutEngine.calculate(inputs, TEST_CONSTRAINTS);
    expect(result1.positions).toEqual(result2.positions);
    expect(result1.chipScale).toBe(result2.chipScale);
  });

  test("No hay jugadores fuera de límites (Home)", () => {
    const inputs = createFormation("4-4-2");
    // Home team is in bottom half (y > 50)
    const constraints: LayoutConstraints = {
      ...TEST_CONSTRAINTS,
      fieldBounds: { xMin: 0, xMax: 100, yMin: 50, yMax: 100, isAwayHalf: false },
    };
    const result = LayoutEngine.calculate(inputs, constraints);

    const chipH = constraints.chipSize.baseHeight * result.chipScale;
    const textH = constraints.nameAreaBounds.height * result.chipScale;

    result.positions.forEach((pos) => {
      // Must not invade away half (y < 50)
      const topY = pos.y - chipH / 2 - constraints.margins.vertical;
      expect(topY).toBeGreaterThanOrEqual(49); // Giving 1 unit of float tolerance
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.x).toBeLessThanOrEqual(100);
    });
  });

  test("Escala máxima alcanzada sin colisiones (4-3-3)", () => {
    const inputs = createFormation("4-3-3");
    const result = LayoutEngine.calculate(inputs, TEST_CONSTRAINTS);

    expect(result.chipScale).toBeGreaterThan(0.3); // Ensure it climbed up
    
    // Check no overlaps manually
    const chipW = TEST_CONSTRAINTS.chipSize.baseWidth * result.chipScale;
    const totalH = (TEST_CONSTRAINTS.chipSize.baseHeight + TEST_CONSTRAINTS.nameAreaBounds.height) * result.chipScale;

    let overlapFound = false;
    for (let i = 0; i < result.positions.length; i++) {
      for (let j = i + 1; j < result.positions.length; j++) {
        const dx = Math.abs(result.positions[i].x - result.positions[j].x);
        const dy = Math.abs(result.positions[i].y - result.positions[j].y);
        if (dx < chipW && dy < totalH) {
          overlapFound = true;
        }
      }
    }
    expect(overlapFound).toBe(false);
  });

  test("Formación densa (3-5-2) no tiene colisiones", () => {
    const inputs = createFormation("3-5-2");
    const result = LayoutEngine.calculate(inputs, TEST_CONSTRAINTS);

    const chipW = TEST_CONSTRAINTS.chipSize.baseWidth * result.chipScale;
    const totalH = (TEST_CONSTRAINTS.chipSize.baseHeight + TEST_CONSTRAINTS.nameAreaBounds.height) * result.chipScale;

    let overlapFound = false;
    for (let i = 0; i < result.positions.length; i++) {
      for (let j = i + 1; j < result.positions.length; j++) {
        const dx = Math.abs(result.positions[i].x - result.positions[j].x);
        const dy = Math.abs(result.positions[i].y - result.positions[j].y);
        if (dx < chipW && dy < totalH) {
          overlapFound = true;
          console.log(`Overlap between ${result.positions[i].id} and ${result.positions[j].id} at scale ${result.chipScale}`, { p1: result.positions[i], p2: result.positions[j] });
        }
      }
    }
    expect(overlapFound).toBe(false);
  });
});
