"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BottomChrome } from "@/components/layout/BottomChrome";
import { BOTTOM_CHROME_PLACEHOLDER_ID } from "@/lib/layout/bottom-chrome";

/**
 * Portal a body (patrón marbella) montado en useLayoutEffect — antes del paint post-hidratación.
 * Hasta entonces el placeholder SSR en AppShell cubre el hueco inferior.
 */
export function TabBarWrapper() {
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
    document.documentElement.dataset.tabChromeReady = "true";
    return () => {
      delete document.documentElement.dataset.tabChromeReady;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(<BottomChrome />, document.body);
}
