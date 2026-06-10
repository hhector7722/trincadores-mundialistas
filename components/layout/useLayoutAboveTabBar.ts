"use client";

import { useLayoutEffect, type RefObject } from "react";
import {
  resetLayoutAboveTabBar,
  syncLayoutAboveIndicators,
  syncLayoutAboveTabBar,
  VIEWPORT_CHROME_SYNC_EVENT,
} from "@/lib/layout/viewport-chrome";
import { TAB_INDICATORS_SYNC_EVENT } from "@/lib/layout/tab-indicators-position";

export type LayoutBottomAnchor = "tabbar" | "indicators";

/** Fija la altura del contenedor hasta la TabBar o los indicadores swipe. */
export function useLayoutAboveTabBar(
  rootRef: RefObject<HTMLElement | null>,
  enabled = true,
  bottomAnchor: LayoutBottomAnchor = "tabbar"
) {
  useLayoutEffect(() => {
    if (!enabled) return;

    const root = rootRef.current;
    if (!root) return;

    const sync = () => {
      if (bottomAnchor === "indicators") {
        syncLayoutAboveIndicators(root);
      } else {
        syncLayoutAboveTabBar(root);
      }
    };

    sync();
    requestAnimationFrame(sync);

    const observer = new ResizeObserver(sync);
    observer.observe(root);
    if (root.parentElement) observer.observe(root.parentElement);

    const nav = document.querySelector('nav[aria-label="Navegacion principal"]');
    if (nav) observer.observe(nav);

    if (bottomAnchor === "indicators") {
      const indicators = document.querySelector(".tm-tab-indicators-slot");
      if (indicators) observer.observe(indicators);
    }

    window.addEventListener("resize", sync);
    window.addEventListener(VIEWPORT_CHROME_SYNC_EVENT, sync);
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    if (bottomAnchor === "indicators") {
      window.addEventListener(TAB_INDICATORS_SYNC_EVENT, sync);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener(VIEWPORT_CHROME_SYNC_EVENT, sync);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      if (bottomAnchor === "indicators") {
        window.removeEventListener(TAB_INDICATORS_SYNC_EVENT, sync);
      }
      resetLayoutAboveTabBar(root);
    };
  }, [rootRef, enabled, bottomAnchor]);
}
