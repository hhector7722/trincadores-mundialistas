import { clampToBounds, type PlayableBounds } from "@/lib/lineup/field-layout";
import type { FieldCoordinate, LineupSlot } from "@/lib/lineup/types";

/** Huella visual aproximada de ficha match (camiseta + nombre) en % del campo. */
export type ChipFootprint = {
  jerseyHalfW: number;
  jerseyHalfH: number;
  labelHalfW: number;
  labelHalfH: number;
  /** Centro de la etiqueta de nombre respecto al ancla de la ficha. */
  labelOffsetY: number;
  gap: number;
};

/** Calibrado para camisetas/nombres a escala base (sin transform CSS). */
export const MATCH_CHIP_FOOTPRINT: ChipFootprint = {
  jerseyHalfW: 10.5,
  jerseyHalfH: 10,
  labelHalfW: 11.5,
  labelHalfH: 3.5,
  labelOffsetY: 12,
  gap: 0.8,
};

/** Escala visual típica en campo MVP horizontal (sin tocar el render). */
export const MVP_FIELD_EFFECTIVE_CHIP_SCALE = 1;

export function scaleChipFootprint(
  footprint: ChipFootprint,
  chipScale: number
): ChipFootprint {
  return {
    jerseyHalfW: footprint.jerseyHalfW * chipScale,
    jerseyHalfH: footprint.jerseyHalfH * chipScale,
    labelHalfW: footprint.labelHalfW * chipScale,
    labelHalfH: footprint.labelHalfH * chipScale,
    labelOffsetY: footprint.labelOffsetY * chipScale,
    gap: footprint.gap,
  };
}

type Rect = { cx: number; cy: number; halfW: number; halfH: number };

type PositionedSlot = LineupSlot & { originX: number; originY: number };

export type TacticalCollisionMode =
  | "master"
  | "horizontal-away"
  | "horizontal-home"
  | "vertical-away"
  | "vertical-home";

export type ResolveTacticalCollisionsOptions = {
  bounds: PlayableBounds;
  footprint?: ChipFootprint;
  mode?: TacticalCollisionMode;
  /** Factor de escala visual aplicado a la huella (p. ej. chipScale del render). */
  chipScale?: number;
  /** Desplazamiento máximo desde la coordenada base (%). */
  maxNudge?: number;
  maxPasses?: number;
};

const DEFAULT_MAX_NUDGE = 12;
const DEFAULT_MAX_PASSES = 48;

const FULLBACK_KEYS = new Set(["LB", "RB", "LWB", "RWB"]);
const CENTER_BACK_KEYS = new Set(["LCB", "RCB", "CB"]);
const GOALKEEPER_KEY = "GK";

function isHorizontalMode(mode: TacticalCollisionMode): boolean {
  return mode === "horizontal-away" || mode === "horizontal-home";
}

function isVerticalMode(mode: TacticalCollisionMode): boolean {
  return mode === "vertical-away" || mode === "vertical-home";
}

function jerseyRect(slot: FieldCoordinate, footprint: ChipFootprint): Rect {
  return {
    cx: slot.x,
    cy: slot.y,
    halfW: footprint.jerseyHalfW,
    halfH: footprint.jerseyHalfH,
  };
}

function labelRect(slot: FieldCoordinate, footprint: ChipFootprint): Rect {
  return {
    cx: slot.x,
    cy: slot.y + footprint.labelOffsetY,
    halfW: footprint.labelHalfW,
    halfH: footprint.labelHalfH,
  };
}

function rectsOverlap(a: Rect, b: Rect, gap: number): boolean {
  return (
    Math.abs(a.cx - b.cx) < a.halfW + b.halfW + gap &&
    Math.abs(a.cy - b.cy) < a.halfH + b.halfH + gap
  );
}

function separationVector(
  a: Rect,
  b: Rect,
  gap: number,
  mode: TacticalCollisionMode
): { dx: number; dy: number } {
  const overlapX = a.halfW + b.halfW + gap - Math.abs(a.cx - b.cx);
  const overlapY = a.halfH + b.halfH + gap - Math.abs(a.cy - b.cy);
  if (overlapX <= 0 || overlapY <= 0) return { dx: 0, dy: 0 };

  if (isHorizontalMode(mode)) {
    const sameDepth = Math.abs(a.cx - b.cx) < 6;
    if (sameDepth || overlapY <= overlapX) {
      const dir = a.cy <= b.cy ? -1 : 1;
      return { dx: 0, dy: (overlapY / 2) * dir };
    }
    const dir = a.cx <= b.cx ? -1 : 1;
    return { dx: (overlapX / 2) * dir, dy: 0 };
  }

  if (isVerticalMode(mode)) {
    const sameDepth = Math.abs(a.cy - b.cy) < 6;
    if (sameDepth || overlapX <= overlapY) {
      const dir = a.cx <= b.cx ? -1 : 1;
      return { dx: (overlapX / 2) * dir, dy: 0 };
    }
    const dir = a.cy <= b.cy ? -1 : 1;
    return { dx: 0, dy: (overlapY / 2) * dir };
  }

  if (overlapX < overlapY) {
    const dir = a.cx <= b.cx ? -1 : 1;
    return { dx: (overlapX / 2) * dir, dy: 0 };
  }

  const dir = a.cy <= b.cy ? -1 : 1;
  return { dx: 0, dy: (overlapY / 2) * dir };
}

function slotRects(slot: FieldCoordinate, footprint: ChipFootprint): Rect[] {
  return [jerseyRect(slot, footprint), labelRect(slot, footprint)];
}

function slotsCollide(
  a: FieldCoordinate,
  b: FieldCoordinate,
  footprint: ChipFootprint
): boolean {
  const rectsA = slotRects(a, footprint);
  const rectsB = slotRects(b, footprint);
  for (const ra of rectsA) {
    for (const rb of rectsB) {
      if (rectsOverlap(ra, rb, footprint.gap)) return true;
    }
  }
  return false;
}

function isGoalkeeper(slot: LineupSlot): boolean {
  return slot.slotKey === GOALKEEPER_KEY || slot.role === "GK";
}

function isFullback(slot: LineupSlot): boolean {
  return FULLBACK_KEYS.has(slot.slotKey ?? "");
}

function isCenterBack(slot: LineupSlot): boolean {
  return CENTER_BACK_KEYS.has(slot.slotKey ?? "");
}

function anchorCoord(
  slot: LineupSlot,
  mode: TacticalCollisionMode,
  bounds: PlayableBounds
): Partial<FieldCoordinate> {
  if (!isGoalkeeper(slot)) return {};

  switch (mode) {
    case "horizontal-away":
      return { x: bounds.xMin };
    case "horizontal-home":
      return { x: bounds.xMax };
    case "vertical-away":
      return { y: bounds.yMin };
    case "vertical-home":
      return { y: bounds.yMax };
    case "master":
    default:
      return { y: bounds.yMax };
  }
}

function nudgeLimits(
  slot: LineupSlot,
  mode: TacticalCollisionMode,
  maxNudge: number
): { maxX: number; maxY: number } {
  if (isGoalkeeper(slot)) {
    if (isHorizontalMode(mode)) return { maxX: 0, maxY: Math.min(maxNudge, 7) };
    if (mode === "master") return { maxX: 0, maxY: Math.min(maxNudge, 3) };
    return { maxX: Math.min(maxNudge, 4), maxY: 0 };
  }

  if (isHorizontalMode(mode)) {
    return { maxX: Math.min(maxNudge, 10), maxY: maxNudge };
  }

  if (isVerticalMode(mode)) {
    return { maxX: maxNudge, maxY: Math.min(maxNudge, 4) };
  }

  return { maxX: maxNudge, maxY: maxNudge };
}

function mobilityWeight(slot: LineupSlot, mode: TacticalCollisionMode): { x: number; y: number } {
  if (isGoalkeeper(slot)) {
    if (isHorizontalMode(mode)) return { x: 0, y: 1 };
    if (mode === "master") return { x: 0, y: 0.5 };
    return { x: 0.6, y: 0 };
  }

  if (isHorizontalMode(mode)) {
    if (isFullback(slot)) return { x: 0.25, y: 1.2 };
    if (isCenterBack(slot)) return { x: 0.3, y: 1.1 };
    return { x: 0.35, y: 1.05 };
  }

  if (isFullback(slot)) return { x: 1.15, y: 0.85 };
  if (isCenterBack(slot)) return { x: 0.95, y: 1.05 };
  return { x: 1, y: 1 };
}

function biasNudge(
  slot: LineupSlot,
  other: LineupSlot,
  nudge: { dx: number; dy: number },
  mode: TacticalCollisionMode
): { dx: number; dy: number } {
  let { dx, dy } = nudge;
  if (dx === 0 && dy === 0) return nudge;

  if (isGoalkeeper(other) && !isGoalkeeper(slot)) {
    dx = 0;
  }

  if (isVerticalMode(mode)) {
    dy = 0;
  }

  if (isFullback(slot) && isCenterBack(other) && !isHorizontalMode(mode)) {
    const openOut =
      (slot.slotKey === "LB" || slot.slotKey === "LWB") && dx < 0
        ? 1.25
        : (slot.slotKey === "RB" || slot.slotKey === "RWB") && dx > 0
          ? 1.25
          : 1;
    dx *= openOut;
  }

  if (isCenterBack(slot) && isFullback(other) && !isHorizontalMode(mode)) {
    dy *= 1.1;
    dx *= 0.75;
  }

  return { dx, dy };
}

function applyWeightedNudge(
  slot: PositionedSlot,
  nudge: { dx: number; dy: number },
  weight: { x: number; y: number },
  mode: TacticalCollisionMode,
  maxNudge: number
): PositionedSlot {
  const limits = nudgeLimits(slot, mode, maxNudge);
  const nextX = slot.x + nudge.dx * weight.x;
  const nextY = slot.y + nudge.dy * weight.y;
  let clampedX = Math.min(
    slot.originX + limits.maxX,
    Math.max(slot.originX - limits.maxX, nextX)
  );
  if (isHorizontalMode(mode) && !isGoalkeeper(slot)) {
    if (mode === "horizontal-away") {
      clampedX = Math.max(clampedX, slot.originX - Math.min(limits.maxX, 3));
    } else {
      clampedX = Math.min(clampedX, slot.originX + Math.min(limits.maxX, 3));
    }
  }
  const clampedY = Math.min(
    slot.originY + limits.maxY,
    Math.max(slot.originY - limits.maxY, nextY)
  );
  return { ...slot, x: clampedX, y: clampedY };
}

function reanchorGoalkeeper(
  slot: PositionedSlot,
  mode: TacticalCollisionMode,
  bounds: PlayableBounds
): PositionedSlot {
  if (!isGoalkeeper(slot)) return slot;
  const anchor = anchorCoord(slot, mode, bounds);
  return {
    ...slot,
    x: anchor.x ?? slot.x,
    y: anchor.y ?? slot.y,
  };
}

function finalizeSlot(
  slot: PositionedSlot,
  mode: TacticalCollisionMode,
  bounds: PlayableBounds
): PositionedSlot {
  const clamped = { ...slot, ...clampToBounds(slot, bounds) };
  return reanchorGoalkeeper(clamped, mode, bounds);
}

/**
 * Resuelve solapamientos entre camisetas y nombres con microdesplazamientos.
 * Conserva la geometría base; prioriza anclar al portero en la línea de gol.
 */
export function resolveTacticalSlotCollisions<T extends LineupSlot>(
  slots: T[],
  options: ResolveTacticalCollisionsOptions
): T[] {
  if (slots.length < 2) return slots;

  const footprint = scaleChipFootprint(
    options.footprint ?? MATCH_CHIP_FOOTPRINT,
    options.chipScale ?? 1
  );
  const mode = options.mode ?? "master";
  const maxNudge = options.maxNudge ?? DEFAULT_MAX_NUDGE;
  const maxPasses = options.maxPasses ?? DEFAULT_MAX_PASSES;
  const bounds = options.bounds;

  let positioned: PositionedSlot[] = slots.map((slot) => {
    const anchored = { ...slot, ...anchorCoord(slot, mode, bounds) };
    const clamped = clampToBounds(anchored, bounds);
    return {
      ...anchored,
      ...clamped,
      originX: clamped.x,
      originY: clamped.y,
    };
  });

  const pushBoost = 1.25;

  function relax(passMaxNudge: number): boolean {
    let moved = false;

    for (let pass = 0; pass < maxPasses; pass += 1) {
      let passMoved = false;

      for (let i = 0; i < positioned.length; i += 1) {
        for (let j = i + 1; j < positioned.length; j += 1) {
          const a = positioned[i]!;
          const b = positioned[j]!;
          if (!slotsCollide(a, b, footprint)) continue;

          const rectsA = slotRects(a, footprint);
          const rectsB = slotRects(b, footprint);
          let best = { dx: 0, dy: 0 };
          let bestOverlap = 0;

          for (const ra of rectsA) {
            for (const rb of rectsB) {
              if (!rectsOverlap(ra, rb, footprint.gap)) continue;
              const sep = separationVector(ra, rb, footprint.gap, mode);
              const magnitude = Math.abs(sep.dx) + Math.abs(sep.dy);
              if (magnitude > bestOverlap) {
                bestOverlap = magnitude;
                best = sep;
              }
            }
          }

          if (bestOverlap === 0) continue;

          const nudgeA = biasNudge(
            a,
            b,
            { dx: best.dx * pushBoost, dy: best.dy * pushBoost },
            mode
          );
          const nudgeB = biasNudge(
            b,
            a,
            { dx: -best.dx * pushBoost, dy: -best.dy * pushBoost },
            mode
          );

          positioned[i] = finalizeSlot(
            applyWeightedNudge(a, nudgeA, mobilityWeight(a, mode), mode, passMaxNudge),
            mode,
            bounds
          );
          positioned[j] = finalizeSlot(
            applyWeightedNudge(b, nudgeB, mobilityWeight(b, mode), mode, passMaxNudge),
            mode,
            bounds
          );
          passMoved = true;
          moved = true;
        }
      }

      if (!passMoved) break;
    }

    return moved;
  }

  relax(maxNudge);

  if (hasTacticalSlotCollisions(positioned, footprint)) {
    relax(maxNudge + 5);
  }

  for (let sweep = 0; sweep < 16; sweep += 1) {
    let swept = false;
    for (let i = 0; i < positioned.length; i += 1) {
      for (let j = i + 1; j < positioned.length; j += 1) {
        const a = positioned[i]!;
        const b = positioned[j]!;
        if (!slotsCollide(a, b, footprint)) continue;

        const ra = jerseyRect(a, footprint);
        const rb = jerseyRect(b, footprint);
        const sep = separationVector(ra, rb, footprint.gap, mode);
        if (sep.dx === 0 && sep.dy === 0) continue;

        const mobile = isGoalkeeper(a) && !isGoalkeeper(b) ? b : a;
        const fixed = mobile === a ? b : a;
        const sign = mobile === a ? 1 : -1;
        const nudge = biasNudge(
          mobile,
          fixed,
          { dx: sep.dx * sign * 1.35, dy: sep.dy * sign * 1.35 },
          mode
        );

        const idx = positioned.indexOf(mobile);
        positioned[idx] = finalizeSlot(
          applyWeightedNudge(
            mobile,
            nudge,
            mobilityWeight(mobile, mode),
            mode,
            maxNudge + 4
          ),
          mode,
          bounds
        );
        swept = true;
      }
    }
    if (!swept) break;
  }

  const finalized = positioned.map((slot) => finalizeSlot(slot, mode, bounds));

  return finalized.map(({ originX: _ox, originY: _oy, ...slot }) => slot as T);
}

/** Comprueba si quedan colisiones (tests / diagnóstico). */
export function hasTacticalSlotCollisions(
  slots: LineupSlot[],
  footprint: ChipFootprint = MATCH_CHIP_FOOTPRINT
): boolean {
  for (let i = 0; i < slots.length; i += 1) {
    for (let j = i + 1; j < slots.length; j += 1) {
      if (slotsCollide(slots[i]!, slots[j]!, footprint)) return true;
    }
  }
  return false;
}
