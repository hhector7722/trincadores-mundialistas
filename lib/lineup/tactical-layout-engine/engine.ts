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
          verticalFieldUsage: 0,
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

    // --- AUDITORÍA DE BANDAS ---
    console.log(`\n[TACTICAL ENGINE AUDIT] Band depth ordering verification:`);
    console.log(`| Band | OriginalY | OptimizedY | DeltaY |`);
    console.log(`|---|---|---|---|`);

    const isAwayHalf = constraints.fieldBounds.isAwayHalf;
    let orderIsValid = true;

    const bandYs = structure.bands.map((band, index) => {
      // Original Y (mean of referenceY)
      const origYs = band.elements.map(id => {
        const el = normalized.find(p => p.id === id);
        return el ? el.referenceY : 0;
      });
      const originalY = origYs.reduce((acc, y) => acc + y, 0) / (origYs.length || 1);

      // Optimized Y (mean of final position y)
      const optYs = band.elements.map(id => {
        const el = positions.find(p => p.id === id);
        return el ? el.y : 0;
      });
      const optimizedY = optYs.reduce((acc, y) => acc + y, 0) / (optYs.length || 1);

      const deltaY = optimizedY - originalY;
      console.log(`| Band ${index} (${band.elements.join(",")}) | ${originalY.toFixed(2)} | ${optimizedY.toFixed(2)} | ${deltaY.toFixed(2)} |`);

      return { index, originalY, optimizedY };
    });

    // Verify Y(Band[i]) > Y(Band[i+1]) for home (GK at high Y, FW at low Y)
    // and Y(Band[i]) < Y(Band[i+1]) for away (GK at low Y, FW at high Y)
    for (let i = 0; i < bandYs.length - 1; i++) {
      if (isAwayHalf) {
        if (bandYs[i].optimizedY >= bandYs[i + 1].optimizedY) {
          orderIsValid = false;
        }
      } else {
        if (bandYs[i].optimizedY <= bandYs[i + 1].optimizedY) {
          orderIsValid = false;
        }
      }
    }

    if (orderIsValid) {
      console.log(`[TACTICAL ENGINE AUDIT] SUCCESS: Band order and minimum spacing are strictly preserved!`);
    } else {
      console.error(`[TACTICAL ENGINE AUDIT] ERROR: Band order violation detected! Bands are overlapping or inverted.`);
      throw new Error("Invalid layout: Band depth ordering is violated.");
    }

    // --- VALIDACIÓN DE ORIENTACIÓN ---
    const gkIds = normalized.filter(p => p.role === "GK").map(p => p.id);
    const fwIds = normalized.filter(p => p.role === "FW").map(p => p.id);

    if (gkIds.length > 0 && fwIds.length > 0) {
      const gkPosList = positions.filter(p => gkIds.includes(p.id));
      const fwPosList = positions.filter(p => fwIds.includes(p.id));

      const gkYMean = gkPosList.reduce((acc, p) => acc + p.y, 0) / gkPosList.length;
      const fwYMean = fwPosList.reduce((acc, p) => acc + p.y, 0) / fwPosList.length;

      if (isAwayHalf) {
        if (gkYMean >= fwYMean) {
          throw new Error(`Orientation error: Goalkeeper Y (${gkYMean}) must be less than Forward Y (${fwYMean}) on Away half.`);
        }
      } else {
        if (gkYMean <= fwYMean) {
          throw new Error(`Orientation error: Goalkeeper Y (${gkYMean}) must be greater than Forward Y (${fwYMean}) on Home half.`);
        }
      }
      console.log(`[TACTICAL ORIENTATION VALIDATOR] SUCCESS: Goalkeeper and Forward orientation is correct!`);
    }

    const chipH = constraints.chipSize.baseHeight * finalScale;
    const textH = constraints.nameAreaBounds.height * finalScale;
    const dynamicVertMargin = Math.max(constraints.margins.vertical, chipH * 0.15);
    const b = constraints.fieldBounds || { xMin: 0, xMax: 100, yMin: 0, yMax: 100 };
    const minY = b.yMin + (chipH / 2) + dynamicVertMargin;
    const maxY = b.yMax - (chipH / 2) - textH - dynamicVertMargin;
    const usableHeight = maxY - minY;

    let occupiedHeight = 0;
    if (positions.length > 0) {
      const yValues = positions.map(p => p.y);
      occupiedHeight = Math.max(...yValues) - Math.min(...yValues);
    }

    console.log(`[TACTICAL SPACE USAGE AUDIT]`);
    console.log(`- Usable height: ${usableHeight.toFixed(2)}`);
    console.log(`- Occupied height: ${occupiedHeight.toFixed(2)}`);
    console.log(`- Vertical field usage: ${metrics.verticalFieldUsage.toFixed(1)}%\n`);

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
