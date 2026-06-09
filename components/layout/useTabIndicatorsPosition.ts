"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import {
  applyTabIndicatorsBottom,
  resetTabIndicatorsBottom,
} from "@/lib/layout/tab-indicators-position";

const QUIZ_ANCHOR_SELECTOR = '[data-tm-indicators-anchor="quiz-daily"]';

/** Sincroniza --tm-tab-indicators-bottom al eje Y entre Quiz diario y la TabBar. */
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

    const anchor = document.querySelector(QUIZ_ANCHOR_SELECTOR);
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(sync)
        : null;

    if (anchor && resizeObserver) {
      resizeObserver.observe(anchor);
    }

    const homeLayout = document.querySelector(".tm-home-layout");
    if (homeLayout && resizeObserver) {
      resizeObserver.observe(homeLayout);
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
