"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BottomChrome } from "@/components/layout/BottomChrome";

/**
 * Portal a body (patrón marbella-app) — blinda fixed ante transform/overflow del shell.
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
