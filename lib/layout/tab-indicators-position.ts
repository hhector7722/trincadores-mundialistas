import { readTabBarTop } from "@/lib/layout/viewport-chrome";

export const TAB_INDICATOR_DOT_SIZE = 6;

const QUIZ_ANCHOR_SELECTOR = '[data-tm-indicators-anchor="quiz-daily"]';

/** Hueco medido en Inicio entre la card Quiz diario y la TabBar. */
let cachedContentGap: number | null = null;

const FALLBACK_GAP_PX = 24;

function readVisualViewportBottom(): number {
  const vv = window.visualViewport;
  return vv ? vv.offsetTop + vv.height : window.innerHeight;
}

/** Distancia desde el borde inferior del viewport hasta los indicadores (CSS `bottom`). */
export function measureTabIndicatorsBottom(): number {
  const tabBarTop = readTabBarTop();
  const anchor = document.querySelector<HTMLElement>(QUIZ_ANCHOR_SELECTOR);

  let gap: number;
  if (anchor) {
    const cardBottom = anchor.getBoundingClientRect().bottom;
    gap = Math.max(0, tabBarTop - cardBottom);
    cachedContentGap = gap;
  } else if (cachedContentGap != null) {
    gap = cachedContentGap;
  } else {
    gap = FALLBACK_GAP_PX;
  }

  const midpointFromTop = (tabBarTop - gap / 2);
  const visualBottom = readVisualViewportBottom();

  return Math.round(visualBottom - midpointFromTop - TAB_INDICATOR_DOT_SIZE / 2);
}

export function applyTabIndicatorsBottom(): void {
  const bottom = measureTabIndicatorsBottom();
  document.documentElement.style.setProperty("--tm-tab-indicators-bottom", `${bottom}px`);
}

export function resetTabIndicatorsBottom(): void {
  document.documentElement.style.removeProperty("--tm-tab-indicators-bottom");
}
