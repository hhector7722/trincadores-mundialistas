import { LayoutConstraints, LayoutPosition, LayoutDebug, TacticalBand } from "./types";
import { TacticalStructure } from "./tactical-structure";
import { detectCollisions, CollisionIssue } from "./collision-detector";

type ScoredLayout = {
  positions: LayoutPosition[];
  scale: number;
  score: number;
  debug: LayoutDebug;
};

export function optimizeLayout(
  initialPositions: LayoutPosition[],
  structure: TacticalStructure,
  constraints: LayoutConstraints
): { positions: LayoutPosition[]; finalScale: number; iterations: number; collisionsResolved: number; debug: LayoutDebug } {
  let bestValidLayout: ScoredLayout | null = null;
  let iterations = 0;
  
  let low = constraints.chipSize.minScale;
  let high = constraints.chipSize.maxScale;
  let maxValidScale = low;
  const tolerance = constraints.optimization.tolerance;

  while (low <= high) {
    iterations++;
    const currentScale = (low + high) / 2;
    const { positions, valid, debug } = attemptLayoutAtScale(initialPositions, currentScale, constraints, structure);
    
    if (valid) {
      maxValidScale = currentScale;
      low = currentScale + tolerance;
      
      const score = calculateAestheticScore(positions, currentScale, structure);
      if (!bestValidLayout || currentScale > bestValidLayout.scale || (Math.abs(currentScale - bestValidLayout.scale) < tolerance && score > bestValidLayout.score)) {
        bestValidLayout = { positions, scale: currentScale, score, debug };
      }
    } else {
      high = currentScale - tolerance;
    }
  }

  if (!bestValidLayout) {
    const { positions, debug } = attemptLayoutAtScale(initialPositions, constraints.chipSize.minScale, constraints, structure);
    bestValidLayout = {
      positions,
      scale: constraints.chipSize.minScale,
      score: calculateAestheticScore(positions, constraints.chipSize.minScale, structure),
      debug
    };
  }

  const finalLayout = refineLayoutAesthetics(bestValidLayout.positions, bestValidLayout.scale, constraints, structure);
  
  return {
    positions: finalLayout.positions,
    finalScale: bestValidLayout.scale,
    iterations,
    collisionsResolved: 0, 
    debug: finalLayout.debug
  };
}

function attemptLayoutAtScale(
  initialPositions: LayoutPosition[],
  scale: number,
  constraints: LayoutConstraints,
  structure: TacticalStructure
): { positions: LayoutPosition[]; valid: boolean; debug: LayoutDebug } {
  let positions = initialPositions.map(p => ({ ...p }));
  const maxForceIterations = 40;
  let valid = false;

  const debug: LayoutDebug = {
    detectedBands: structure.bands,
    detectedLanes: {},
    attemptedLayouts: 1,
    rejectedLayouts: 0,
    optimizationStageReached: "force-directed",
    activeConstraints: [],
    optimizationSequence: [],
    collisionBoxes: [],
    stopReason: "max-iterations",
    warnings: []
  };

  let consecutiveValid = 0;
  let bestValidPositions: LayoutPosition[] | null = null;
  let bestValidScore = -Infinity;

  for (let i = 0; i < maxForceIterations; i++) {
    const issues = detectCollisions(positions, scale, constraints);
    
    if (issues.length === 0) {
      valid = true;
      consecutiveValid++;
      
      const score = calculateAestheticScore(positions, scale, structure);
      if (score > bestValidScore) {
        bestValidScore = score;
        bestValidPositions = positions.map(p => ({ ...p }));
      }

      // Avoid local minima by allowing the layout to "settle" for a few iterations
      if (consecutiveValid > 5) {
        debug.stopReason = "settled";
        break;
      }
    } else {
      consecutiveValid = 0;
    }

    applySeparationForces(positions, issues, scale, constraints);
    applyTacticalForces(positions, initialPositions, structure, issues.length === 0);
    applyContainmentForces(positions, scale, constraints);
    enforceBandOrderAndSpacing(positions, structure, scale, constraints);
  }

  // Ensure containment and band spacing are strictly enforced at the very end
  applyContainmentForces(positions, scale, constraints);
  enforceBandOrderAndSpacing(positions, structure, scale, constraints);

  // Re-check final state
  const finalIssues = detectCollisions(positions, scale, constraints);
  if (finalIssues.length === 0) {
    valid = true;
    const finalScore = calculateAestheticScore(positions, scale, structure);
    if (finalScore > bestValidScore) {
      bestValidPositions = positions;
    }
  }

  return { 
    positions: valid && bestValidPositions ? bestValidPositions : positions, 
    valid, 
    debug 
  };
}

function refineLayoutAesthetics(
  positions: LayoutPosition[],
  scale: number,
  constraints: LayoutConstraints,
  structure: TacticalStructure
): { positions: LayoutPosition[]; debug: LayoutDebug } {
  let currentPositions = positions.map(p => ({ ...p }));
  const tolerance = 3;

  // Final symmetry alignment: average mirror pairs within the same band
  for (const band of structure.bands) {
    const bandPositions = band.elements
      .map(id => currentPositions.find(p => p.id === id))
      .filter((p): p is LayoutPosition => p != null);

    for (let i = 0; i < bandPositions.length; i++) {
      for (let j = i + 1; j < bandPositions.length; j++) {
        const a = bandPositions[i];
        const b = bandPositions[j];
        const mirrorDiff = Math.abs((100 - a.x) - b.x);
        if (mirrorDiff < tolerance && Math.abs(a.y - b.y) < tolerance) {
          const avgX = (a.x + (100 - b.x)) / 2;
          a.x = avgX;
          b.x = 100 - avgX;
        }
      }
    }
  }

  // ── SPACE EXPANSION PHASE (DYNAMIC MAXIMUM) ──
  const chipH = constraints.chipSize.baseHeight * scale;
  const textH = constraints.nameAreaBounds.height * scale;
  const dynamicVertMargin = Math.max(constraints.margins.vertical, chipH * 0.15);
  const b = constraints.fieldBounds || { xMin: 0, xMax: 100, yMin: 0, yMax: 100 };
  const minY = b.yMin + (chipH / 2) + dynamicVertMargin;
  const maxY = b.yMax - (chipH / 2) - textH - dynamicVertMargin;
  const usableHeight = maxY - minY;

  if (usableHeight > 0 && currentPositions.length > 0) {
    // We expand progressively from the goalkeeper's Y coordinate (band 0) as anchor
    const gkId = structure.bands[0]?.elements[0];
    const gkPos = currentPositions.find(p => p.id === gkId);
    const anchorY = gkPos ? gkPos.y : (b.isAwayHalf ? minY : maxY);

    let bestExpandedPositions = currentPositions.map(p => ({ ...p }));
    let currentFactor = 1.0;
    const factorStep = 0.01;
    const maxFactor = 2.5;

    while (currentFactor < maxFactor) {
      const nextFactor = currentFactor + factorStep;
      const testPositions = currentPositions.map(p => {
        const nextY = anchorY + (p.y - anchorY) * nextFactor;
        return { ...p, y: nextY };
      });

      // Run containment and spacing to let them adapt
      applyContainmentForces(testPositions, scale, constraints);
      enforceBandOrderAndSpacing(testPositions, structure, scale, constraints);

      // Verify constraints: no collisions and correct band ordering
      const collisions = detectCollisions(testPositions, scale, constraints);
      const orderValid = checkBandOrder(testPositions, structure, b.isAwayHalf);

      if (collisions.length === 0 && orderValid) {
        bestExpandedPositions = testPositions.map(p => ({ ...p }));
        currentFactor = nextFactor;
      } else {
        break; // Stop when any constraint is violated
      }
    }

    currentPositions = bestExpandedPositions;
  }

  // Re-run containment and spacing to maintain bounds and tactical layout
  if (constraints.chipSize) {
    applyContainmentForces(currentPositions, scale, constraints);
    enforceBandOrderAndSpacing(currentPositions, structure, scale, constraints);
  }

  return {
    positions: currentPositions,
    debug: {
      detectedBands: structure.bands,
      detectedLanes: {},
      attemptedLayouts: 1,
      rejectedLayouts: 0,
      optimizationStageReached: "aesthetic-refinement",
      activeConstraints: [],
      optimizationSequence: [],
      collisionBoxes: [],
      stopReason: "refined",
      warnings: []
    }
  };
}

function calculateAestheticScore(positions: LayoutPosition[], scale: number, structure: TacticalStructure): number {
  let symmetryScore = 0;
  let verticalSpread = 0;
  let sumX = 0;

  for (const pos of positions) {
    sumX += pos.x;
    const mirrorX = 100 - pos.x;
    let foundMirror = false;
    
    for (const other of positions) {
      if (other.id !== pos.id && Math.abs(other.x - mirrorX) < 4 && Math.abs(other.y - pos.y) < 4) {
        foundMirror = true;
        break;
      }
    }
    
    if (foundMirror) {
      symmetryScore += 5;
    } else if (Math.abs(pos.x - 50) < 3) {
      symmetryScore += 5; // Central players provide symmetry
    }
    
    // Reward players using more vertical space (avoids cramming)
    verticalSpread += Math.abs(pos.y - 50); 
  }
  
  // Balance penalizes if the center of mass is shifted left or right
  const balance = Math.abs(50 - (sumX / positions.length));
  
  return (scale * 1000) + (symmetryScore * 10) - (balance * 5) + (verticalSpread * 0.5);
}

function applySeparationForces(positions: LayoutPosition[], issues: CollisionIssue[], scale: number, constraints: LayoutConstraints) {
  const pushFactor = 0.3;
  const damping = 0.85;

  issues.forEach(issue => {
    if (issue.type === "overlap") {
      const p1 = positions.find(p => p.id === issue.id1);
      const p2 = positions.find(p => p.id === issue.id2);
      if (p1 && p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Normalize direction, apply damping
        const nx = dx / dist;
        const ny = dy / dist;

        p1.x += nx * pushFactor * damping;
        p2.x -= nx * pushFactor * damping;
        p1.y += ny * pushFactor * damping;
        p2.y -= ny * pushFactor * damping;
      }
    }
  });
}

function applyContainmentForces(positions: LayoutPosition[], scale: number, constraints: LayoutConstraints) {
  const chipW = constraints.chipSize.baseWidth * scale;
  const textH = constraints.nameAreaBounds.height * scale;
  const chipH = constraints.chipSize.baseHeight * scale;
  
  const b = constraints.fieldBounds || { xMin: 0, xMax: 100, yMin: 0, yMax: 100 };
  // Use a dynamic margin that adapts to the chip size, ensuring the field edges are never too tight
  const dynamicSideMargin = Math.max(constraints.margins.side, chipW * 0.15);
  const dynamicVertMargin = Math.max(constraints.margins.vertical, chipH * 0.15);

  positions.forEach(pos => {
    const minX = b.xMin + (chipW / 2) + dynamicSideMargin;
    const maxX = b.xMax - (chipW / 2) - dynamicSideMargin;
    if (pos.x < minX) pos.x = minX;
    if (pos.x > maxX) pos.x = maxX;

    const minY = b.yMin + (chipH / 2) + dynamicVertMargin;
    const maxY = b.yMax - (chipH / 2) - textH - dynamicVertMargin;
    if (pos.y < minY) pos.y = minY;
    if (pos.y > maxY) pos.y = maxY;
  });
}

function applyTacticalForces(
  positions: LayoutPosition[],
  initialPositions: LayoutPosition[],
  structure: TacticalStructure,
  isValid: boolean
) {
  const pullFactor = isValid ? 0.025 : 0.06;
  const expandFactor = 0.015;
  const centerThreshold = 50;

  positions.forEach(pos => {
    const initial = initialPositions.find(p => p.id === pos.id);
    const element = structure.elements.get(pos.id);
    if (initial && element) {
      // Pull X towards original tactical reference width
      pos.x += (element.referenceX - pos.x) * pullFactor;
      // Pull Y towards resolved Y depth (which preserves band separation)
      pos.y += (initial.y - pos.y) * pullFactor;

      // Horizontal expansion: push away from center to fill the wings
      // Only apply if the player isn't meant to be central
      if (Math.abs(element.referenceX - centerThreshold) > 8) {
        const direction = element.referenceX > centerThreshold ? 1 : -1;
        pos.x += direction * expandFactor;
      }

      // Central pull for central players
      if (Math.abs(element.referenceX - centerThreshold) <= 8) {
        pos.x += (centerThreshold - pos.x) * pullFactor;
      }

      // Mirror symmetry: if initial positions have a mirror pair, maintain it
      const mirrorX = 100 - element.referenceX;
      const partnerId = Array.from(structure.elements.keys()).find(id => {
        const el = structure.elements.get(id);
        return id !== pos.id && el && Math.abs(el.referenceX - mirrorX) < 5 && Math.abs(el.referenceY - element.referenceY) < 5;
      });

      if (partnerId) {
        const partner = positions.find(p => p.id === partnerId);
        if (partner) {
          const mirroredTarget = 100 - partner.x;
          pos.x += (mirroredTarget - pos.x) * (pullFactor * 0.3);
        }
      }
    }
  });
}

function enforce4231VerticalConstraint(positions: LayoutPosition[], isAwayHalf: boolean) {
  const st = positions.find(p => p.id === "ST");
  const am = positions.find(p => p.id === "AM");
  if (!st || !am) return;

  const ldm = positions.find(p => p.id === "LDM") || positions.find(p => p.id === "LCM") || positions.find(p => p.id === "DM");
  const rdm = positions.find(p => p.id === "RDM") || positions.find(p => p.id === "RCM") || positions.find(p => p.id === "DM");
  if (!ldm && !rdm) return;

  const pivots = [ldm, rdm].filter((p): p is LayoutPosition => p != null);
  const pivotY = pivots.reduce((acc, p) => acc + p.y, 0) / pivots.length;

  const distST_AM = Math.abs(st.y - am.y);
  const distAM_pivot = Math.abs(am.y - pivotY);

  // We want: distST_AM >= distAM_pivot + 2.5 (ST is clearly further from AM than AM is from pivot)
  const targetGap = distAM_pivot + 2.5;
  if (distST_AM < targetGap) {
    const diff = targetGap - distST_AM;
    if (isAwayHalf) {
      // ldm.y < am.y < st.y
      st.y += diff * 0.4;
      am.y -= diff * 0.6;
    } else {
      // st.y < am.y < ldm.y
      st.y -= diff * 0.4;
      am.y += diff * 0.6;
    }
  }
}

function enforceBandOrderAndSpacing(
  positions: LayoutPosition[],
  structure: TacticalStructure,
  scale: number,
  constraints: LayoutConstraints
) {
  const bands = structure.bands;
  if (bands.length <= 1) return;

  const isAwayHalf = constraints.fieldBounds.isAwayHalf;
  
  // Enforce a larger spacing (11.5) for the striker/forward band to separate it from midfielders
  const getMinSpacing = (index: number) => {
    if (index === bands.length - 1) {
      return 11.5;
    }
    return 6.5;
  };

  // Perform 3 iterations of sequential adjustments to satisfy spacing and boundaries
  for (let iter = 0; iter < 3; iter++) {
    // 1. Calculate current average Y of each band
    const bandYs = bands.map(band => {
      const bandPositions = band.elements
        .map(id => positions.find(p => p.id === id))
        .filter((p): p is LayoutPosition => p != null);
      const sumY = bandPositions.reduce((acc, p) => acc + p.y, 0);
      return {
        band,
        y: bandPositions.length > 0 ? sumY / bandPositions.length : 0
      };
    });

    if (isAwayHalf) {
      // Away half: Goalkeeper (band 0) is at the top (low Y), Strikers (last band) at the bottom (high Y)
      // We must satisfy: Y(band i) >= Y(band i-1) + minSpacing
      for (let i = 1; i < bandYs.length; i++) {
        const spacing = getMinSpacing(i);
        const targetMinY = bandYs[i - 1].y + spacing;
        if (bandYs[i].y < targetMinY) {
          const shift = targetMinY - bandYs[i].y;
          bandYs[i].y = targetMinY;
          bandYs[i].band.elements.forEach(id => {
            const p = positions.find(el => el.id === id);
            if (p) p.y += shift;
          });
        }
      }
    } else {
      // Home half: Goalkeeper (band 0) is at the bottom (high Y), Strikers (last band) at the top (low Y)
      // We must satisfy: Y(band i) <= Y(band i-1) - minSpacing
      for (let i = 1; i < bandYs.length; i++) {
        const spacing = getMinSpacing(i);
        const targetMaxY = bandYs[i - 1].y - spacing;
        if (bandYs[i].y > targetMaxY) {
          const shift = targetMaxY - bandYs[i].y;
          bandYs[i].y = targetMaxY;
          bandYs[i].band.elements.forEach(id => {
            const p = positions.find(el => el.id === id);
            if (p) p.y += shift;
          });
        }
      }
    }

    // Apply specific 4-2-3-1 vertical separation rule
    enforce4231VerticalConstraint(positions, isAwayHalf);

    // After shifting, run containment to keep elements within field boundary constraints
    applyContainmentForces(positions, scale, constraints);
  }
}

function checkBandOrder(
  positions: LayoutPosition[],
  structure: TacticalStructure,
  isAwayHalf: boolean
): boolean {
  const bands = structure.bands;
  if (bands.length <= 1) return true;

  const bandYs = bands.map(band => {
    const bandPositions = band.elements
      .map(id => positions.find(p => p.id === id))
      .filter((p): p is LayoutPosition => p != null);
    const sumY = bandPositions.reduce((acc, p) => acc + p.y, 0);
    return bandPositions.length > 0 ? sumY / bandPositions.length : 0;
  });

  const getMinSpacing = (index: number) => {
    if (index === bands.length - 1) {
      return 11.0;
    }
    return 6.0;
  };

  for (let i = 0; i < bandYs.length - 1; i++) {
    const spacing = getMinSpacing(i + 1);
    if (isAwayHalf) {
      if (bandYs[i + 1] < bandYs[i] + spacing) return false;
    } else {
      if (bandYs[i + 1] > bandYs[i] - spacing) return false;
    }
  }

  // Enforce specific 4-2-3-1 vertical spacing check: distance(ST, AM) > distance(AM, double_pivot)
  const st = positions.find(p => p.id === "ST");
  const am = positions.find(p => p.id === "AM");
  if (st && am) {
    const ldm = positions.find(p => p.id === "LDM") || positions.find(p => p.id === "LCM") || positions.find(p => p.id === "DM");
    const rdm = positions.find(p => p.id === "RDM") || positions.find(p => p.id === "RCM") || positions.find(p => p.id === "DM");
    if (ldm || rdm) {
      const pivots = [ldm, rdm].filter((p): p is LayoutPosition => p != null);
      const pivotY = pivots.reduce((acc, p) => acc + p.y, 0) / pivots.length;

      const distST_AM = Math.abs(st.y - am.y);
      const distAM_pivot = Math.abs(am.y - pivotY);

      if (distST_AM < distAM_pivot - 0.2) {
        return false;
      }
    }
  }

  return true;
}
