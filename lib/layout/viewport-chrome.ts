const TAB_BAR_SELECTOR = 'nav[aria-label="Navegacion principal"]';

/** Borde superior visible de la TabBar (contenido usable termina aquí). */
export function readTabBarTop(): number {
  const nav = document.querySelector<HTMLElement>(TAB_BAR_SELECTOR);
  if (nav) {
    return nav.getBoundingClientRect().top;
  }

  const probe = document.getElementById("tm-safe-probe");
  const safeBottom = probe
    ? parseFloat(getComputedStyle(probe).paddingBottom) || 0
    : 0;
  const tabBarCore =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--tm-tabbar-core")
    ) || 80;

  return window.innerHeight - tabBarCore - safeBottom;
}

const INDICATOR_GAP_ABOVE_PX = 10;
const INDICATOR_ZONE_FALLBACK_PX = 34;

/** Borde inferior del contenido: justo encima de los indicadores de pestaña. */
export function readLayoutBottomAboveIndicators(): number {
  const slot = document.querySelector<HTMLElement>(".tm-tab-indicators-slot");
  if (slot?.firstElementChild) {
    const indicatorTop = slot.getBoundingClientRect().top;
    if (indicatorTop > 0) {
      return indicatorTop - INDICATOR_GAP_ABOVE_PX;
    }
  }

  return readTabBarTop() - INDICATOR_ZONE_FALLBACK_PX;
}

/** Fija la altura de un contenedor flex desde su top hasta la TabBar. */
export function syncLayoutAboveTabBar(root: HTMLElement): number {
  const top = root.getBoundingClientRect().top;
  const height = Math.max(0, Math.floor(readTabBarTop() - top));

  root.style.height = `${height}px`;
  root.style.maxHeight = `${height}px`;
  root.style.flex = "0 0 auto";

  return height;
}

/** Fija la altura del contenedor hasta encima de los indicadores swipe. */
export function syncLayoutAboveIndicators(root: HTMLElement): number {
  const top = root.getBoundingClientRect().top;
  const height = Math.max(0, Math.floor(readLayoutBottomAboveIndicators() - top));

  root.style.height = `${height}px`;
  root.style.maxHeight = `${height}px`;
  root.style.flex = "0 0 auto";

  return height;
}

export function resetLayoutAboveTabBar(root: HTMLElement): void {
  root.style.removeProperty("height");
  root.style.removeProperty("max-height");
  root.style.removeProperty("flex");
}
