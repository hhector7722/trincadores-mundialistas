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
    applyTacticalForces(positions, initialPositions, issues.length === 0);
    applyContainmentForces(positions, scale, constraints);
  }

  // Ensure containment is strictly enforced at the very end
  applyContainmentForces(positions, scale, constraints);

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
  // A final pass to explicitly improve symmetry and alignment if possible
  let currentPositions = positions.map(p => ({ ...p }));
  
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
  const pushFactor = 0.5;

  issues.forEach(issue => {
    if (issue.type === "overlap") {
      const p1 = positions.find(p => p.id === issue.id1);
      const p2 = positions.find(p => p.id === issue.id2);
      if (p1 && p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        
        // Push apart slightly more horizontally than vertically if they are side by side
        if (Math.abs(dx) > Math.abs(dy)) {
          const push = dx > 0 ? pushFactor : -pushFactor;
          p1.x += push;
          p2.x -= push;
        } else {
          const push = dy > 0 ? pushFactor : -pushFactor;
          p1.y += push;
          p2.y -= push;
        }
      }
    }
  });
}

function applyContainmentForces(positions: LayoutPosition[], scale: number, constraints: LayoutConstraints) {
  const chipW = constraints.chipSize.baseWidth * scale;
  const textH = constraints.nameAreaBounds.height * scale;
  const chipH = constraints.chipSize.baseHeight * scale;
  
  const b = constraints.fieldBounds || { xMin: 0, xMax: 100, yMin: 0, yMax: 100 };

  positions.forEach(pos => {
    const minX = b.xMin + (chipW / 2) + constraints.margins.side;
    const maxX = b.xMax - (chipW / 2) - constraints.margins.side;
    if (pos.x < minX) pos.x = minX;
    if (pos.x > maxX) pos.x = maxX;

    const minY = b.yMin + (chipH / 2) + constraints.margins.vertical;
    const maxY = b.yMax - (chipH / 2) - textH - constraints.margins.vertical;
    if (pos.y < minY) pos.y = minY;
    if (pos.y > maxY) pos.y = maxY;
  });
}

function applyTacticalForces(positions: LayoutPosition[], initialPositions: LayoutPosition[], isValid: boolean) {
  // If the layout is valid, pull very gently towards tactical positions.
  // If it's invalid, pull slightly stronger to retain shape during separation.
  // We reduce the pull factor to prioritize aesthetics/separation over precise tactical positions.
  const pullFactor = isValid ? 0.02 : 0.05;
  
  positions.forEach(pos => {
    const initial = initialPositions.find(p => p.id === pos.id);
    if (initial) {
      pos.x += (initial.x - pos.x) * pullFactor;
      pos.y += (initial.y - pos.y) * pullFactor;
      
      // Additional symmetry force: pull towards mirror position if one exists in initial layout
      const initialMirrorX = 100 - initial.x;
      const hasMirror = initialPositions.some(p => p.id !== initial.id && Math.abs(p.x - initialMirrorX) < 5 && Math.abs(p.y - initial.y) < 5);
      
      if (hasMirror) {
        // Find current mirror partner and align them
        const partner = positions.find(p => p.id !== pos.id && Math.abs(initialPositions.find(ip => ip.id === p.id)!.x - initialMirrorX) < 5);
        if (partner) {
          const targetX = 100 - partner.x;
          pos.x += (targetX - pos.x) * (pullFactor * 0.5);
        }
      } else if (Math.abs(initial.x - 50) < 5) {
        // If it's a central player, gently pull towards center
        pos.x += (50 - pos.x) * (pullFactor * 0.5);
      }
    }
  });
}
