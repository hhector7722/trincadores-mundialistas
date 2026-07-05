import { LayoutConstraints, LayoutPosition } from "./types";
import { TacticalStructure } from "./tactical-structure";

/**
 * Genera posiciones iniciales para una mitad del campo.
 * Cada equipo se optimiza de forma completamente independiente:
 * el layout de una mitad nunca depende del de la otra.
 *
 * Las bandas de campo se distribuyen proporcionalmente a la distancia
 * táctica original (referenceY) entre líneas consecutivas.
 * Si DEF→MID era el doble que MID→FW, tras la expansión sigue siéndolo.
 * No hay reglas específicas por formación: las proporciones emergen
 * de las coordenadas de entrada.
 */
export function solveInitialLayout(
  structure: TacticalStructure,
  constraints: LayoutConstraints
): LayoutPosition[] {
  const positions: LayoutPosition[] = [];
  const { bands } = structure;
  if (bands.length === 0) return positions;

  const approxScale = 1.0;
  const chipH = constraints.chipSize.baseHeight * approxScale;
  const textH = constraints.nameAreaBounds.height * approxScale;
  const dynamicVertMargin = Math.max(constraints.margins.vertical, chipH * 0.15);

  const b = constraints.fieldBounds || { xMin: 0, xMax: 100, yMin: 0, yMax: 100 };
  const minY = b.yMin + (chipH / 2) + dynamicVertMargin;
  const maxY = b.yMax - (chipH / 2) - textH - dynamicVertMargin;
  const vRange = maxY - minY;
  const numBands = bands.length;

  // Espacio que separa al portero de la defensa (menor que entre el resto de líneas)
  const gkGap = vRange * 0.08;
  const fieldMinV = constraints.fieldBounds.isAwayHalf ? minY + gkGap : minY;
  const fieldMaxV = constraints.fieldBounds.isAwayHalf ? maxY : maxY - gkGap;
  const fieldVRange = fieldMaxV - fieldMinV;

  // Calcular referenceY promedio de cada banda de campo (bandas 1..n-1)
  const bandRefYs: number[] = [];
  for (let b = 1; b < numBands; b++) {
    const elements = bands[b].elements;
    let sumRefY = 0;
    for (const id of elements) {
      const el = structure.elements.get(id);
      if (el) sumRefY += el.referenceY;
    }
    const avgRefY = elements.length > 0 ? sumRefY / elements.length : 0;
    bandRefYs.push(avgRefY);
  }

  // Distancias proporcionales entre bandas consecutivas
  const proportionalDistances: number[] = [];
  for (let i = 0; i < bandRefYs.length - 1; i++) {
    proportionalDistances.push(Math.abs(bandRefYs[i] - bandRefYs[i + 1]));
  }
  const totalPropDist = proportionalDistances.reduce((a, b) => a + b, 0);

  bands.forEach((band, bandIndex) => {
    let bandY = 50;

    if (numBands === 1) {
      bandY = (minY + maxY) / 2;
    } else if (bandIndex === 0) {
      bandY = constraints.fieldBounds.isAwayHalf ? minY : maxY;
    } else if (totalPropDist === 0 || proportionalDistances.length === 0) {
      // Una sola banda de campo — colocar al extremo opuesto
      if (constraints.fieldBounds.isAwayHalf) {
        bandY = fieldMinV;
      } else {
        bandY = fieldMaxV;
      }
    } else {
      const fieldIndex = bandIndex - 1;
      let cumulativeDist = 0;
      for (let i = 0; i < fieldIndex; i++) {
        cumulativeDist += proportionalDistances[i];
      }
      const proportion = cumulativeDist / totalPropDist;
      if (constraints.fieldBounds.isAwayHalf) {
        bandY = fieldMinV + proportion * fieldVRange;
      } else {
        bandY = fieldMaxV - proportion * fieldVRange;
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
    else if (numElements === 2) hSpread = availableWidth * 0.92;
    else if (numElements === 3) hSpread = availableWidth * 0.98;
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
