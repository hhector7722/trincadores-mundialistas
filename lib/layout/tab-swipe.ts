import { MAIN_TABS } from "@/lib/layout/main-tabs";

/** Deslizar el dedo hacia la izquierda o hacia la derecha. */
export type TabSwipeDirection = "left" | "right";

/**
 * Orden barra (izq → der): Quiz | La tabla | Inicio | Partidos | Perfil
 *
 * Carrusel invertido respecto al orden visual:
 * Deslizar ← → pestaña a la derecha en la barra (índice mayor).
 * Deslizar → → pestaña a la izquierda en la barra (índice menor).
 */
export function getTabNeighborForSwipe(
  activeIndex: number,
  direction: TabSwipeDirection
): number | null {
  if (direction === "left") {
    return activeIndex < MAIN_TABS.length - 1 ? activeIndex + 1 : null;
  }
  return activeIndex > 0 ? activeIndex - 1 : null;
}

export function pointerOffsetToSwipeDirection(offset: number): TabSwipeDirection | null {
  if (offset < 0) return "left";
  if (offset > 0) return "right";
  return null;
}

export function shouldApplyEdgeResistance(
  activeIndex: number,
  direction: TabSwipeDirection
): boolean {
  if (direction === "left") return activeIndex === MAIN_TABS.length - 1;
  return activeIndex === 0;
}

export function resolveTabSwipeCommit(
  activeIndex: number,
  offset: number,
  velocity: number,
  width: number,
  options?: { commitRatio?: number; velocityThreshold?: number }
): number | null {
  const commitRatio = options?.commitRatio ?? 0.16;
  const velocityThreshold = options?.velocityThreshold ?? 0.22;
  const direction = pointerOffsetToSwipeDirection(offset);
  if (!direction) return null;

  const ratio = Math.abs(offset) / Math.max(width, 1);
  const committed =
    direction === "left"
      ? ratio >= commitRatio || velocity < -velocityThreshold
      : ratio >= commitRatio || velocity > velocityThreshold;

  if (!committed) return null;

  return getTabNeighborForSwipe(activeIndex, direction);
}

export function getTabSwipeProgress(activeIndex: number, dragOffset: number, width: number): number {
  if (width <= 0) return activeIndex;
  return activeIndex - dragOffset / width;
}

/** Vecinos visuales en la barra (para peek al arrastrar). */
export function getMainTabBarNeighbors(activeIndex: number) {
  return {
    left: activeIndex > 0 ? activeIndex - 1 : null,
    right: activeIndex < MAIN_TABS.length - 1 ? activeIndex + 1 : null,
  };
}
