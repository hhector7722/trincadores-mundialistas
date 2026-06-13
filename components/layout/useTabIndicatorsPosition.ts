"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import {
  applyTabIndicatorsBottom,
  resetTabIndicatorsBottom,
} from "@/lib/layout/tab-indicators-position";
import { applyVisualViewportChrome } from "@/lib/layout/viewport-chrome";

const TAB_BAR_SELECTOR = 'nav[aria-label="Navegacion principal"]';

/** Sincroniza visual viewport + --tm-tab-indicators-bottom sobre la TabBar. */
export function useTabIndicatorsPosition(enabled = true) {
  const pathname = usePathname();

  useLayoutEffect(() => {
    let frame = 0;

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        applyVisualViewportChrome();
        if (enabled) {
          applyTabIndicatorsBottom();
        } else {
          resetTabIndicatorsBottom();
        }
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
