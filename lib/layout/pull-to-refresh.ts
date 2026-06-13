/** Selectores de contenedor principal por ruta (orden de prioridad). */
export const PULL_SCROLL_SELECTORS = [
  ".tm-tab-scroll-layout",
  ".tm-quiz-play-scroll",
  ".tm-quiz-page:not(.tm-quiz-page--play):not(.tm-quiz-page--hub):not(.tm-quiz-page--viewport)",
  ".tm-porra-layout",
  ".tm-ranking-layout",
  ".tm-quiz-page--hub",
  ".tm-quiz-page--viewport",
] as const;

export const PULL_THRESHOLD_PX = 68;
export const PULL_MAX_PX = 112;
export const PULL_RESISTANCE = 0.52;

export function isPullRefreshBlocked(): boolean {
  if (typeof document === "undefined") return true;
  const html = document.documentElement;
  return (
    html.hasAttribute("data-modal-open") ||
    html.hasAttribute("data-tab-swipe-dragging") ||
    Boolean(document.querySelector(".tm-quiz-page--play"))
  );
}

export function findPullScrollRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;

  if (!document.querySelector(".tm-app-main--internal-scroll")) {
    return document.documentElement;
  }

  for (const selector of PULL_SCROLL_SELECTORS) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) return el;
  }

  return document.querySelector<HTMLElement>(".tm-tab-swipe-root");
}

export function findNearestScrollable(
  target: EventTarget | null,
  boundary: HTMLElement
): HTMLElement | null {
  if (!(target instanceof Element)) return boundary;

  if (boundary === document.documentElement) {
    return document.documentElement;
  }

  let node: Element | null = target;
  while (node && node !== boundary.parentElement) {
    if (node instanceof HTMLElement && node !== boundary) {
      if (node.hasAttribute("data-block-pull-refresh")) return node;
      const { overflowY } = getComputedStyle(node);
      if (
        (overflowY === "auto" || overflowY === "scroll") &&
        node.scrollHeight > node.clientHeight + 1
      ) {
        return node;
      }
    }
    node = node.parentElement;
  }

  return boundary;
}

export function isScrollAtTop(el: HTMLElement): boolean {
  if (el === document.documentElement) {
    return (window.scrollY ?? document.documentElement.scrollTop) <= 1;
  }
  return el.scrollTop <= 1;
}

export function applyPullResistance(distance: number): number {
  if (distance <= 0) return 0;
  const capped = Math.min(distance, PULL_MAX_PX * 1.35);
  return capped * PULL_RESISTANCE;
}

export function pullProgress(distance: number): number {
  return Math.min(1, distance / PULL_THRESHOLD_PX);
}
