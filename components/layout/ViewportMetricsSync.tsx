"use client";

import { useLayoutEffect } from "react";
import {
  enableNativeShell,
  resetNativeShellViewport,
  scheduleNativeShellViewportSync,
  syncNativeShellViewport,
} from "@/lib/layout/viewport-shell";

/** Mantiene body + shell alineados al visual viewport tras hidratar (teclado / Safari iOS). */
export function ViewportMetricsSync() {
  useLayoutEffect(() => {
    const onChange = () => syncNativeShellViewport();

    enableNativeShell();
    scheduleNativeShellViewportSync();

    window.visualViewport?.addEventListener("resize", onChange);
    window.visualViewport?.addEventListener("scroll", onChange);
    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", scheduleNativeShellViewportSync);
    window.addEventListener("pageshow", scheduleNativeShellViewportSync);

    return () => {
      window.visualViewport?.removeEventListener("resize", onChange);
      window.visualViewport?.removeEventListener("scroll", onChange);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", scheduleNativeShellViewportSync);
      window.removeEventListener("pageshow", scheduleNativeShellViewportSync);
      resetNativeShellViewport();
    };
  }, []);

  return null;
}
