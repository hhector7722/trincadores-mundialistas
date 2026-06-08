export const MAIN_TABS = [
  { href: "/quiz", label: "Quiz" },
  { href: "/ranking", label: "La tabla" },
  { href: "/", label: "Inicio" },
  { href: "/predictions", label: "Partidos" },
  { href: "/profile", label: "Perfil" },
] as const;

/** Orden izq→der en barra; swipe ←/→ entre vecinos vía lib/layout/tab-swipe.ts */

export type MainTabHref = (typeof MAIN_TABS)[number]["href"];

export const MAIN_TAB_HREFS = MAIN_TABS.map((tab) => tab.href);

export function isMainTabActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href;
}

/** Índice de sección para indicadores (incluye subrutas de la misma pestaña). */
export function getMainTabSectionIndex(pathname: string): number | null {
  for (let i = 0; i < MAIN_TABS.length; i++) {
    const href = MAIN_TABS[i].href;
    if (href === "/") {
      if (pathname === "/") return i;
      continue;
    }
    if (pathname === href || pathname.startsWith(`${href}/`)) return i;
  }
  return null;
}

/** Índice solo en rutas raíz donde el swipe entre pestañas está activo. */
export function getMainTabIndex(pathname: string): number | null {
  for (let i = 0; i < MAIN_TABS.length; i++) {
    if (isMainTabActive(pathname, MAIN_TABS[i].href)) return i;
  }
  return null;
}

export function isMainTabRoot(pathname: string): boolean {
  return getMainTabIndex(pathname) !== null;
}
