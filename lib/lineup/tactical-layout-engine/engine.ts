import { LayoutConstraints, LayoutElementInput, LayoutResult } from "./types";
import { normalizeInput } from "./input-normalizer";
import { buildTacticalStructure } from "./tactical-structure";
import { solveInitialLayout } from "./initial-solver";
import { optimizeLayout } from "./optimizer";
import { calculateMetrics } from "./metrics";

export class LayoutEngine {
  /**
   * Ejecuta el pipeline completo de optimización de layout espacial.
   * Totalmente determinista y desacoplado del renderizado.
   */
  static calculate(inputs: LayoutElementInput[], constraints: LayoutConstraints): LayoutResult {
    const normalized = normalizeInput(inputs);

    if (normalized.length === 0) {
      return {
        positions: [],
        bands: [],
        chipScale: 1,
        calculatedMargins: constraints.margins,
        metrics: {
          chipScale: 1,
          fieldCoverage: 0,
          usefulSpacePercentage: 0,
          wastedSpace: 100,
          horizontalDeviation: 0,
          verticalDeviation: 0,
          symmetryScore: 100,
          tacticalDeviation: 0,
          minimumElementDistance: 0,
          minimumNameDistance: 0,
          iterations: 0,
          adjustmentsMade: 0,
          collisionsResolved: 0,
          stopReason: "empty"
        },
      };
    }

    const structure = buildTacticalStructure(normalized, constraints.fieldBounds.isAwayHalf);
    const initialPositions = solveInitialLayout(structure, constraints);
    const { positions, finalScale, iterations, collisionsResolved, debug } = optimizeLayout(
      initialPositions,
      structure,
      constraints
    );

    const metrics = calculateMetrics(
      normalized,
      positions,
      structure.bands,
      finalScale,
      iterations,
      collisionsResolved,
      debug.stopReason,
      constraints
    );

    return {
      positions,
      bands: structure.bands,
      chipScale: finalScale,
      calculatedMargins: constraints.margins,
      metrics,
      debug: process.env.NODE_ENV === "development" ? debug : undefined,
    };
  }
}
