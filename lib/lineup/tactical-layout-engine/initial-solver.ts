import { LayoutConstraints, LayoutPosition } from "./types";
import { TacticalStructure } from "./tactical-structure";

/**
 * Genera posiciones iniciales para una mitad del campo.
 * Cada equipo se optimiza de forma completamente independiente:
 * el layout de una mitad nunca depende del de la otra.
 *
 * Las posiciones de los jugadores se reparten para ocupar
 * ~90–95 % de la profundidad disponible, con el portero
 * ligeramente más cerca de la defensa que el resto de líneas.
 *
 * Formaciones con mediapunta (AM, refY ~26) detrás del delantero (ST, refY ~9)
 * reciben un reparto ponderado: la distancia ST→AM es mayor que AM→LDM,
 * garantizando tres alturas ofensivas claramente diferenciadas.
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

  const gkGap = vRange * 0.08;
  const fieldMinV = constraints.fieldBounds.isAwayHalf ? minY + gkGap : minY;
  const fieldMaxV = constraints.fieldBounds.isAwayHalf ? maxY : maxY - gkGap;
  const fieldVRange = fieldMaxV - fieldMinV;
  const fieldBandsCount = Math.max(1, numBands - 1);
  const gapCount = Math.max(1, fieldBandsCount - 1);

  // ── Detección de formaciones con mediapunta (AM, refY ~26) ──
  // Busca una banda cuyo referenceY medio esté en rango de ataque (15-35)
  // y que tenga al menos una banda por encima (ST) y otra por debajo (LDM/MID).
  let hasAMBehindST = false;
  const gapWeights: number[] = [];

  for (let b = 1; b < numBands - 1; b++) {
    const elements = bands[b].elements;
    let sumRefY = 0;
    for (const id of elements) {
      const el = structure.elements.get(id);
      if (el) sumRefY += el.referenceY;
    }
    const avgRefY = elements.length > 0 ? sumRefY / elements.length : 0;

    if (avgRefY >= 15 && avgRefY <= 35) {
      const amFieldIndex = b - 1; // índice dentro de field bands
      if (amFieldIndex > 0 && amFieldIndex < fieldBandsCount - 1) {
        hasAMBehindST = true;
        for (let i = 0; i < gapCount; i++) gapWeights.push(1.0);
        gapWeights[amFieldIndex] = 1.4;     // AM → ST: más separación
        gapWeights[amFieldIndex - 1] = 0.6; // LDM → AM: menos separación
        break;
      }
    }
  }

  // Si se detectó AM, normalizar vStep con pesos para mantener fieldVRange constante
  let vStep = 0;
  if (fieldBandsCount > 1) {
    if (hasAMBehindST) {
      const weightSum = gapWeights.reduce((a, b) => a + b, 0);
      vStep = fieldVRange / weightSum;
    } else {
      vStep = fieldVRange / gapCount;
    }
  }

  bands.forEach((band, bandIndex) => {
    let bandY = 50;

    if (numBands === 1) {
      bandY = (minY + maxY) / 2;
    } else if (bandIndex === 0) {
      bandY = constraints.fieldBounds.isAwayHalf ? minY : maxY;
    } else if (hasAMBehindST) {
      // Distribución ponderada
      const fieldIndex = bandIndex - 1;
      let cumulative = 0;
      for (let i = 0; i < fieldIndex; i++) cumulative += gapWeights[i];
      if (constraints.fieldBounds.isAwayHalf) {
        bandY = fieldMinV + cumulative * vStep;
      } else {
        bandY = fieldMaxV - cumulative * vStep;
      }
    } else {
      // Distribución uniforme original
      const fieldIndex = bandIndex - 1;
      if (constraints.fieldBounds.isAwayHalf) {
        bandY = fieldMinV + fieldIndex * vStep;
      } else {
        bandY = fieldMaxV - fieldIndex * vStep;
      }
    }

    const numElements = band.elements.length;

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
