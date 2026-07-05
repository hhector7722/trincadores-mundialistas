import { LayoutConstraints, LayoutElementInput, LayoutPosition } from "./types";
import { TacticalStructure } from "./tactical-structure";

export function solveInitialLayout(
  structure: TacticalStructure,
  constraints: LayoutConstraints
): LayoutPosition[] {
  const positions: LayoutPosition[] = [];
  const { bands } = structure;
  if (bands.length === 0) return positions;

  const minV = constraints.fieldBounds.yMin + constraints.margins.vertical;
  const maxV = constraints.fieldBounds.yMax - constraints.margins.vertical;
  const vRange = maxV - minV;
  const numBands = bands.length;
  
  // We want the forwards to be at the halfway line (or maxV),
  // and the GK to be at minV. But GK should be closer to defense.
  // We'll calculate a base spread for field players, and attach GK.
  const gkGap = vRange * 0.10; // 10% of the half height — GK closer to defense
  const fieldMinV = constraints.fieldBounds.isAwayHalf ? minV + gkGap : minV;
  const fieldMaxV = constraints.fieldBounds.isAwayHalf ? maxV : maxV - gkGap;
  const fieldVRange = fieldMaxV - fieldMinV;
  const fieldBandsCount = Math.max(1, numBands - 1);
  const vStep = fieldBandsCount > 1 ? fieldVRange / (fieldBandsCount - 1) : 0;

  bands.forEach((band, bandIndex) => {
    let bandY = 50;
    
    if (numBands === 1) {
      bandY = (minV + maxV) / 2;
    } else {
      if (bandIndex === 0) {
        // GK
        bandY = constraints.fieldBounds.isAwayHalf ? minV : maxV;
      } else {
        // Field players
        const fieldIndex = bandIndex - 1;
        if (constraints.fieldBounds.isAwayHalf) {
          bandY = fieldMinV + fieldIndex * vStep;
        } else {
          bandY = fieldMaxV - fieldIndex * vStep;
        }
      }
    }

    const numElements = band.elements.length;
    
    // Maximizar el ancho disponible basado en los márgenes
    const availableWidth = 100 - (constraints.margins.side * 2);
    
    let hSpread = 0;
    if (numElements === 1) hSpread = 0;
    else if (numElements === 2) hSpread = availableWidth * 0.75; // 75% — ocupar bandas
    else if (numElements === 3) hSpread = availableWidth * 0.90;
    else hSpread = availableWidth; // 4 o 5 jugadores usan todo el ancho

    const actualMinX = 50 - hSpread / 2;
    const actualMaxX = 50 + hSpread / 2;
    const hStep = numElements > 1 ? (actualMaxX - actualMinX) / (numElements - 1) : 0;

    band.elements.forEach((elementId, elIndex) => {
      let elementX = 50;
      if (numElements > 1) {
        elementX = actualMinX + elIndex * hStep;
      }
      positions.push({
        id: elementId,
        x: elementX,
        y: bandY,
      });
    });
  });

  return positions;
}
