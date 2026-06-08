const BOTTOM_CHROME_SELECTOR = ".tm-bottom-chrome:not(.tm-bottom-chrome-placeholder)";
const BOTTOM_CHROME_PLACEHOLDER_SELECTOR = ".tm-bottom-chrome-placeholder";

/** Borde inferior visible del contenido: encima del chrome inferior (puntos + TabBar). */
export function bottomAboveTabBar(defaultBottom: number): number {
  const chrome =
    document.querySelector<HTMLElement>(BOTTOM_CHROME_SELECTOR) ??
    document.querySelector<HTMLElement>(BOTTOM_CHROME_PLACEHOLDER_SELECTOR);
  const chromeTop = chrome?.getBoundingClientRect().top;
  if (chromeTop == null || !Number.isFinite(chromeTop) || chromeTop <= 0) return defaultBottom;
  return Math.min(defaultBottom, chromeTop);
}
