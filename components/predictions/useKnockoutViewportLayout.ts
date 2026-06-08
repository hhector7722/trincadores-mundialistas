"use client";

import { useLayoutEffect, type RefObject } from "react";
import {
  resetKnockoutViewportHeight,
  syncKnockoutViewportHeight,
} from "@/lib/predictions/knockout-layout";

export function useKnockoutViewportLayout(rootRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const layoutRoot = root.closest(".tm-porra-layout");
    const pageRoot = root.closest(".tm-porra-page") ?? root;
    if (!(layoutRoot instanceof HTMLElement)) return;

    const sync = () => {
      syncKnockoutViewportHeight(pageRoot, layoutRoot);
    };

    sync();

    const observer = new ResizeObserver(sync);
    observer.observe(layoutRoot);
    observer.observe(pageRoot);

    const tabBar = document.querySelector<HTMLElement>("nav[aria-label='Navegacion principal']");
    if (tabBar) observer.observe(tabBar);

    window.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      resetKnockoutViewportHeight(pageRoot);
    };
  }, [rootRef]);
}
