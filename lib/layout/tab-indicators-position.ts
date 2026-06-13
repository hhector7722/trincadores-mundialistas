import { readTabBarTop } from "@/lib/layout/viewport-chrome";

export const TAB_INDICATOR_DOT_SIZE = 6;

/** Distancia del centro del dot al borde superior de la TabBar. */
const INDICATORS_OFFSET_ABOVE_TABBAR_PX = 14;

function readVisualViewportBottom(): number {
  const vv = window.visualViewport;
  return vv ? vv.offsetTop + vv.height : window.innerHeight;
}

/** Distancia desde el borde inferior del viewport hasta los indicadores (CSS `bottom`). */
export function measureTabIndicatorsBottom(): number {
  const tabBarTop = readTabBarTop();
  const visualBottom = readVisualViewportBottom();
  const dotCenterY = tabBarTop - INDICATORS_OFFSET_ABOVE_TABBAR_PX;

  return Math.round(visualBottom - dotCenterY - TAB_INDICATOR_DOT_SIZE / 2);
}

export const TAB_INDICATORS_SYNC_EVENT = "tm-tab-indicators-sync";

export function applyTabIndicatorsBottom(): void {
  const bottom = measureTabIndicatorsBottom();
  document.documentElement.style.setProperty("--tm-tab-indicators-bottom", `${bottom}px`);
  window.dispatchEvent(new Event(TAB_INDICATORS_SYNC_EVENT));
}

export function resetTabIndicatorsBottom(): void {
  document.documentElement.style.removeProperty("--tm-tab-indicators-bottom");
}
