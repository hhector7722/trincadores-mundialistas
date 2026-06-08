const TABBAR_SELECTOR = "nav[aria-label='Navegacion principal']";

/** Borde inferior visible del contenido: nunca por debajo del borde superior de la TabBar. */
export function bottomAboveTabBar(defaultBottom: number): number {
  const tabBar = document.querySelector<HTMLElement>(TABBAR_SELECTOR);
  const tabBarTop = tabBar?.getBoundingClientRect().top;
  if (tabBarTop == null || !Number.isFinite(tabBarTop)) return defaultBottom;
  return Math.min(defaultBottom, tabBarTop);
}
