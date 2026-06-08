const BOTTOM_CHROME_SELECTOR = ".tm-bottom-chrome:not(.tm-bottom-chrome-placeholder)";
const BOTTOM_CHROME_PLACEHOLDER_SELECTOR = ".tm-bottom-chrome-placeholder";
const TAB_INDICATORS_SELECTOR = ".tm-tab-indicators-float";

/** Borde inferior visible del contenido: encima de indicadores + TabBar. */
export function bottomAboveTabBar(defaultBottom: number): number {
  const indicators = document.querySelector<HTMLElement>(TAB_INDICATORS_SELECTOR);
  const indicatorsTop = indicators?.getBoundingClientRect().top;
  if (indicatorsTop != null && Number.isFinite(indicatorsTop) && indicatorsTop > 0) {
    return Math.min(defaultBottom, indicatorsTop);
  }

  const chrome =
    document.querySelector<HTMLElement>(BOTTOM_CHROME_SELECTOR) ??
    document.querySelector<HTMLElement>(BOTTOM_CHROME_PLACEHOLDER_SELECTOR);
  const chromeTop = chrome?.getBoundingClientRect().top;
  if (chromeTop == null || !Number.isFinite(chromeTop) || chromeTop <= 0) return defaultBottom;
  return Math.min(defaultBottom, chromeTop);
}

export { TAB_INDICATORS_SELECTOR };
