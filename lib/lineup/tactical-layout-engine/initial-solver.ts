import { LayoutConstraints, LayoutElementInput, LayoutPosition } from "./types";
import { TacticalStructure } from "./tactical-structure";

/**
 * Genera posiciones iniciales para una mitad del campo.
 * Cada equipo se optimiza de forma completamente independiente:
 * el layout de una mitad nunca depende del de la otra.
 *
 * Las posiciones de los jugadores se reparten para ocupar
 * ~90–95 % de la profundidad disponible, con el portero
 * ligeramente más cerca de la defensa que el resto de líneas.
 */
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

  // Espacio que separa al portero de la defensa (menor que entre el resto de líneas)
  const gkGap = vRange * 0.05;
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
        bandY = constraints.fieldBounds.isAwayHalf ? minV : maxV;
      } else {
        const fieldIndex = bandIndex - 1;
        if (constraints.fieldBounds.isAwayHalf) {
          bandY = fieldMinV + fieldIndex * vStep;
        } else {
          bandY = fieldMaxV - fieldIndex * vStep;
        }
      }
    }

    const numElements = band.elements.length;

    // Ancho disponible teniendo en cuenta el tamaño aproximado del chip
    const approxScale = (constraints.chipSize.minScale + constraints.chipSize.maxScale) / 2;
    const approxChipW = constraints.chipSize.baseWidth * approxScale;
    const effectiveSideMargin = Math.max(constraints.margins.side, approxChipW * 0.15);
    const availableWidth = 100 - effectiveSideMargin * 2;

    let hSpread = 0;
    if (numElements === 1) hSpread = 0;
    else if (numElements === 2) hSpread = availableWidth * 0.85;
    else if (numElements === 3) hSpread = availableWidth * 0.95;
    else hSpread = availableWidth;

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
