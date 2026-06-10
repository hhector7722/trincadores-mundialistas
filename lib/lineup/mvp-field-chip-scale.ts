/**
 * Escala visual de fichas MVP (solo render, sin tocar coordenadas tácticas).
 * Prioridad: sin solapamientos > ligero aumento de legibilidad (~12 %).
 */

/** Bounding box aproximado de la ficha match a scale=1 (px). */
const CHIP_BASE_WIDTH_PX = 50;
const CHIP_BASE_HEIGHT_PX = 42;

/** Separación mínima entre centros de ficha (% del campo). */
const MIN_SLOT_GAP_X_PCT = 11;
const MIN_SLOT_GAP_Y_PCT = 7;

const LEGIBILITY_BOOST = 1.12;
const SCALE_MIN = 0.38;
const SCALE_MAX = 0.64;

export function computeMvpFieldChipScale(
  fieldWidthPx: number,
  fieldHeightPx: number
): number {
  if (fieldWidthPx < 1 || fieldHeightPx < 1) return SCALE_MIN;

  const baseByHeight = fieldHeightPx / 380;
  const baseByWidth = fieldWidthPx / 620;
  const base = Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.min(baseByHeight, baseByWidth)));

  let scale = Math.min(SCALE_MAX, base * LEGIBILITY_BOOST);

  const maxScaleX = (MIN_SLOT_GAP_X_PCT / 100) * fieldWidthPx / CHIP_BASE_WIDTH_PX;
  const maxScaleY = (MIN_SLOT_GAP_Y_PCT / 100) * fieldHeightPx / CHIP_BASE_HEIGHT_PX;

  scale = Math.min(scale, maxScaleX, maxScaleY);

  return Math.max(SCALE_MIN, Math.round(scale * 1000) / 1000);
}
