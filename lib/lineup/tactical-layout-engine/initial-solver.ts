import { LayoutConstraints, LayoutElementInput, LayoutPosition } from "./types";
import { TacticalStructure } from "./tactical-structure";

export function solveInitialLayout(
  structure: TacticalStructure,
  constraints: LayoutConstraints
): LayoutPosition[] {
  const positions: LayoutPosition[] = [];
  const { bands } = structure;
  if (bands.length === 0) return positions;

  const minV = constraints.margins.vertical;
  const maxV = 100 - constraints.margins.vertical;
  const vRange = maxV - minV;
  const numBands = bands.length;
  const vStep = numBands > 1 ? vRange / (numBands - 1) : 0;

  bands.forEach((band, bandIndex) => {
    let bandY = 50;
    if (numBands > 1) {
      if (constraints.fieldBounds.isAwayHalf) {
        bandY = minV + bandIndex * vStep;
      } else {
        bandY = maxV - bandIndex * vStep;
      }
    }

    const numElements = band.elements.length;
    let hSpread = 0;
    if (numElements === 1) hSpread = 0;
    else if (numElements === 2) hSpread = 30; // 35-65
    else if (numElements === 3) hSpread = 50; // 25-50-75
    else if (numElements === 4) hSpread = 70;
    else hSpread = 90;

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
