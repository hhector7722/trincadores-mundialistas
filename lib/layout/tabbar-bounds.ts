const BOTTOM_CHROME_SELECTOR = ".tm-bottom-chrome";

/** Borde inferior visible del contenido: nunca por debajo del chrome inferior (puntos + TabBar). */
export function bottomAboveTabBar(defaultBottom: number): number {
  const chrome = document.querySelector<HTMLElement>(BOTTOM_CHROME_SELECTOR);
  const chromeTop = chrome?.getBoundingClientRect().top;
  if (chromeTop == null || !Number.isFinite(chromeTop)) return defaultBottom;
  return Math.min(defaultBottom, chromeTop);
}
