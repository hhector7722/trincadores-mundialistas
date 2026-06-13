const TAB_BAR_SELECTOR = 'nav[aria-label="Navegacion principal"]';
const APP_FRAME_SELECTOR = ".tm-app-frame";
export const VIEWPORT_CHROME_SYNC_EVENT = "tm:viewport-chrome-sync";

/** Espacio layout bajo el visual viewport (iOS PWA / barra dinámica). */
export function measureChromeBottomLift(): number {
  if (typeof window === "undefined") return 0;
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, Math.round(window.innerHeight - vv.offsetTop - vv.height));
}

/** Ancla shell + chrome inferior al visual viewport visible. */
export function applyVisualViewportChrome(): void {
  if (typeof document === "undefined") return;

  const vv = window.visualViewport;
  const height = vv ? Math.round(vv.height) : window.innerHeight;
  const offsetTop = vv ? Math.round(vv.offsetTop) : 0;
  const chromeBottom = measureChromeBottomLift();
  const root = document.documentElement;

  root.style.setProperty("--tm-vv-height", `${height}px`);
  root.style.setProperty("--tm-vv-offset-top", `${offsetTop}px`);
  root.style.setProperty("--tm-chrome-bottom", `${chromeBottom}px`);

  const frame = document.querySelector<HTMLElement>(APP_FRAME_SELECTOR);
  if (frame) {
    frame.style.height = `${height}px`;
    frame.style.minHeight = `${height}px`;
    frame.style.maxHeight = `${height}px`;
  }
}

export function resetVisualViewportChrome(): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.removeProperty("--tm-vv-height");
  root.style.removeProperty("--tm-vv-offset-top");
  root.style.removeProperty("--tm-chrome-bottom");

  const frame = document.querySelector<HTMLElement>(APP_FRAME_SELECTOR);
  frame?.style.removeProperty("height");
  frame?.style.removeProperty("min-height");
  frame?.style.removeProperty("max-height");
}

function readTabBarCorePx(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--tm-tabbar-core");
  const parsed = parseFloat(raw);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return 80;
}

function readVisibleViewportBottom(): number {
  const vv = window.visualViewport;
  return vv ? vv.offsetTop + vv.height : window.innerHeight;
}

/** Borde superior visible de la TabBar (contenido usable termina aquí). */
export function readTabBarTop(): number {
  const nav = document.querySelector<HTMLElement>(TAB_BAR_SELECTOR);
  if (nav) {
    return nav.getBoundingClientRect().top;
  }

  // h-20 + pb-safe usa border-box: el safe area ya va dentro de --tm-tabbar-core.
  return readVisibleViewportBottom() - readTabBarCorePx();
}

const INDICATOR_GAP_ABOVE_PX = 10;
const INDICATOR_ZONE_FALLBACK_PX = 34;

/** Borde inferior del contenido: justo encima de los indicadores (dentro de la TabBar). */
export function readLayoutBottomAboveIndicators(): number {
  const nav = document.querySelector<HTMLElement>(TAB_BAR_SELECTOR);
  const indicators = nav?.querySelector<HTMLElement>(".tm-tabbar-indicators-row");
  if (indicators) {
    const indicatorTop = indicators.getBoundingClientRect().top;
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
