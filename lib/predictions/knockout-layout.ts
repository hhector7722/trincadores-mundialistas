import {
  readMainContentBottom,
  syncLayoutAboveTabBar,
} from "@/lib/layout/viewport-chrome";

/** Ancla el cuadro KO al borde inferior del layout (justo encima de la TabBar). */
export function syncKnockoutViewportHeight(
  pageRoot: HTMLElement,
  layoutRoot: HTMLElement
): number {
  syncLayoutAboveTabBar(layoutRoot);
  const top = pageRoot.getBoundingClientRect().top;
  const height = Math.max(0, Math.floor(readMainContentBottom() - top));

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
