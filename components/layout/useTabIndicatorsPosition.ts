"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import {
  applyTabIndicatorsBottom,
  resetTabIndicatorsBottom,
} from "@/lib/layout/tab-indicators-position";

const TAB_BAR_SELECTOR = 'nav[aria-label="Navegacion principal"]';

/** Sincroniza --tm-tab-indicators-bottom justo encima de la TabBar (fixed overlay). */
export function useTabIndicatorsPosition(enabled = true) {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (!enabled) {
      resetTabIndicatorsBottom();
      return;
    }
    let frame = 0;

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        applyTabIndicatorsBottom();
      });
    };

    sync();

    const tabBar = document.querySelector(TAB_BAR_SELECTOR);
    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;

    if (tabBar && resizeObserver) {
      resizeObserver.observe(tabBar);
    }

    window.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      resetTabIndicatorsBottom();
    };
  }, [enabled, pathname]);
}
