import { bottomAboveTabBar } from "@/lib/layout/tabbar-bounds";

/** Ancla el cuadro KO al borde inferior real del layout (justo encima de la TabBar). */
export function syncKnockoutViewportHeight(
  pageRoot: HTMLElement,
  layoutRoot: HTMLElement
): number {
  const layoutRect = layoutRoot.getBoundingClientRect();
  const pageRect = pageRoot.getBoundingClientRect();
  const contentBottom = bottomAboveTabBar(layoutRect.bottom);
  const height = Math.max(0, Math.floor(contentBottom - pageRect.top));

  pageRoot.style.height = `${height}px`;
  pageRoot.style.maxHeight = `${height}px`;
  pageRoot.style.flex = "0 0 auto";

  return height;
}

export function resetKnockoutViewportHeight(pageRoot: HTMLElement): void {
  pageRoot.style.removeProperty("height");
  pageRoot.style.removeProperty("max-height");
  pageRoot.style.removeProperty("flex");
}
