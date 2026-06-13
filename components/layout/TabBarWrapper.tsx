"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BottomChrome } from "@/components/layout/BottomChrome";
import {
  applyVisualViewportChrome,
  VIEWPORT_CHROME_SYNC_EVENT,
} from "@/lib/layout/viewport-chrome";

/**
 * TabBar fija al borde inferior del viewport (portal a body).
 * Evita huecos por overflow/transform del shell y garantiza bottom: 0 real.
 */
export function TabBarWrapper() {
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    applyVisualViewportChrome();
    setMounted(true);
    window.dispatchEvent(new Event(VIEWPORT_CHROME_SYNC_EVENT));

    return () => {
      document.documentElement.style.removeProperty("--tm-chrome-bottom");
    };
  }, []);

  if (!mounted) return null;

  return createPortal(<BottomChrome />, document.body);
}
