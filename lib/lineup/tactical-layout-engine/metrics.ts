import { LayoutConstraints, LayoutMetrics, LayoutPosition, TacticalBand, LayoutElementInput } from "./types";

export function calculateMetrics(
  initialPositions: LayoutElementInput[],
  positions: LayoutPosition[],
  bands: TacticalBand[],
  chipScale: number,
  iterations: number,
  collisionsResolved: number,
  stopReason: string,
  constraints: LayoutConstraints
): LayoutMetrics {
  
  let minElementDist = Infinity;
  let minNameDist = Infinity; 
  
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const p1 = positions[i];
      const p2 = positions[j];
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minElementDist) {
        minElementDist = dist;
      }
    }
  }
  
  if (minElementDist === Infinity) minElementDist = 0;
  if (minNameDist === Infinity) minNameDist = 0;

  let symmetryError = 0;
  bands.forEach(band => {
    let sumX = 0;
    band.elements.forEach(id => {
      const p = positions.find(pos => pos.id === id);
      if (p) sumX += p.x;
    });
    if (band.elements.length > 0) {
      const avgX = sumX / band.elements.length;
      symmetryError += Math.abs(avgX - 50); 
    }
  });

  let totalHDX = 0;
  let totalVDX = 0;
  let tacticalDev = 0;

  positions.forEach(pos => {
    const init = initialPositions.find(p => p.id === pos.id);
    if (init) {
      const dx = Math.abs(pos.x - init.referenceX);
      const dy = Math.abs(pos.y - init.referenceY);
      totalHDX += dx;
      totalVDX += dy;
      tacticalDev += Math.sqrt(dx*dx + dy*dy);
    }
  });

  const avgHorizontalDeviation = positions.length ? totalHDX / positions.length : 0;
  const avgVerticalDeviation = positions.length ? totalVDX / positions.length : 0;
  
  // Calculate space utilization
  // abstract chip area = baseWidth * baseHeight * scale^2
  const chipArea = constraints.chipSize.baseWidth * constraints.chipSize.baseHeight * chipScale * chipScale;
  const totalArea = 100 * 100; // 0-100 x 0-100 abstract field
  const usefulSpacePercentage = Math.min(100, ((chipArea * positions.length) / totalArea) * 100 * 5); // Multiplier to make it a more readable metric
  const wastedSpace = 100 - usefulSpacePercentage;

  return {
    chipScale,
    fieldCoverage: usefulSpacePercentage, // Keeping old field for compatibility if any
    usefulSpacePercentage,
    wastedSpace,
    symmetryScore: Math.max(0, 100 - symmetryError), 
    horizontalDeviation: avgHorizontalDeviation,
    verticalDeviation: avgVerticalDeviation,
    tacticalDeviation: tacticalDev,
    minimumElementDistance: minElementDist,
    minimumNameDistance: minNameDist,
    iterations,
    adjustmentsMade: iterations, // Rough proxy for adjustments
    collisionsResolved,
    stopReason
  };
}
