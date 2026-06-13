"use client";

import { useLayoutEffect } from "react";
import {
  applyVisualViewportChrome,
  VIEWPORT_CHROME_SYNC_EVENT,
} from "@/lib/layout/viewport-chrome";

/** Sincroniza la altura del shell con el visual viewport (iOS PWA). */
export function VisualViewportSync() {
  useLayoutEffect(() => {
    const sync = () => {
      applyVisualViewportChrome();
      window.dispatchEvent(new Event(VIEWPORT_CHROME_SYNC_EVENT));
    };

    sync();
    const frame = requestAnimationFrame(sync);

    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);

    return () => {
      cancelAnimationFrame(frame);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

  return null;
}
