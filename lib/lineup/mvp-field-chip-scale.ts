/**
 * Escala visual de fichas MVP (solo render, sin tocar coordenadas tácticas).
 * Prioridad: sin solapamientos > tamaño máximo permitido por coordenadas.
 */

import type { MvpHorizontalSlot } from "./mvp-horizontal-geometry";

/** Bounding box aproximado de la ficha match a scale=1 (px). */
const CHIP_BASE_WIDTH_PX = 49;
const CHIP_BASE_HEIGHT_PX = 44;

/** Separación mínima entre centros de ficha (% del campo) — fallback sin slots. */
const MIN_SLOT_GAP_X_PCT = 10;
const MIN_SLOT_GAP_Y_PCT = 6.5;

const SCALE_MIN = 0.38;
const SCALE_MAX = 0.78;
const SLOT_SCALE_PADDING = 0.96;

function maxScaleForSlotPair(
  a: MvpHorizontalSlot,
  b: MvpHorizontalSlot,
  fieldWidthPx: number,
  fieldHeightPx: number
): number {
  const dx = (Math.abs(a.x - b.x) / 100) * fieldWidthPx;
  const dy = (Math.abs(a.y - b.y) / 100) * fieldHeightPx;
  const scaleX = dx / (2 * CHIP_BASE_WIDTH_PX);
  const scaleY = dy / (2 * CHIP_BASE_HEIGHT_PX);
  return Math.max(scaleX, scaleY);
}

function maxScaleFromSlots(
  slots: MvpHorizontalSlot[],
  fieldWidthPx: number,
  fieldHeightPx: number
): number {
  let cap = SCALE_MAX;
  for (let i = 0; i < slots.length; i += 1) {
    for (let j = i + 1; j < slots.length; j += 1) {
      cap = Math.min(
        cap,
        maxScaleForSlotPair(slots[i], slots[j], fieldWidthPx, fieldHeightPx)
      );
    }
  }
  return cap * SLOT_SCALE_PADDING;
}

export function computeMvpFieldChipScale(
  fieldWidthPx: number,
  fieldHeightPx: number,
  slots?: MvpHorizontalSlot[]
): number {
  if (fieldWidthPx < 1 || fieldHeightPx < 1) return SCALE_MIN;

  const baseByHeight = fieldHeightPx / 340;
  const baseByWidth = fieldWidthPx / 580;
  let scale = Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.min(baseByHeight, baseByWidth)));

  const maxScaleX = (MIN_SLOT_GAP_X_PCT / 100) * fieldWidthPx / CHIP_BASE_WIDTH_PX;
  const maxScaleY = (MIN_SLOT_GAP_Y_PCT / 100) * fieldHeightPx / CHIP_BASE_HEIGHT_PX;
  scale = Math.min(scale, maxScaleX, maxScaleY);

  if (slots && slots.length > 1) {
    scale = Math.min(scale, maxScaleFromSlots(slots, fieldWidthPx, fieldHeightPx));
  }

  return Math.max(SCALE_MIN, Math.round(scale * 1000) / 1000);
}
