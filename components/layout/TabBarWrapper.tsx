"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BottomChrome } from "@/components/layout/BottomChrome";
import {
  applyVisualViewportChrome,
  VIEWPORT_CHROME_SYNC_EVENT,
} from "@/lib/layout/viewport-chrome";

/**
 * Portal a body (patrón marbella-app) — blinda fixed ante transform/overflow del shell.
 */
export function TabBarWrapper() {
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    applyVisualViewportChrome();
    setMounted(true);
    document.documentElement.dataset.tabChromeReady = "true";
    window.dispatchEvent(new Event(VIEWPORT_CHROME_SYNC_EVENT));
    return () => {
      delete document.documentElement.dataset.tabChromeReady;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(<BottomChrome />, document.body);
}
