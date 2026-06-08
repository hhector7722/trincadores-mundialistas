"use client";

import { useLayoutEffect, type RefObject } from "react";
import {
  resetLayoutAboveTabBar,
  syncLayoutAboveTabBar,
} from "@/lib/layout/viewport-chrome";

/** Fija la altura del contenedor desde su top hasta la TabBar (portal fixed). */
export function useLayoutAboveTabBar(
  rootRef: RefObject<HTMLElement | null>,
  enabled = true
) {
  useLayoutEffect(() => {
    if (!enabled) return;

    const root = rootRef.current;
    if (!root) return;

    const sync = () => {
      syncLayoutAboveTabBar(root);
    };

    sync();
    requestAnimationFrame(sync);

    const observer = new ResizeObserver(sync);
    observer.observe(root);
    if (root.parentElement) observer.observe(root.parentElement);

    const nav = document.querySelector('nav[aria-label="Navegacion principal"]');
    if (nav) observer.observe(nav);

    window.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      resetLayoutAboveTabBar(root);
    };
  }, [rootRef, enabled]);
}
