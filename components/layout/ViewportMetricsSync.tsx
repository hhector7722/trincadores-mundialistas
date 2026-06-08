"use client";

import { useLayoutEffect } from "react";
import { resetViewportMetrics, syncViewportMetrics } from "@/lib/layout/viewport-metrics";

/** Mantiene el shell alineado al visual viewport (teclado / recálculo iOS). */
export function ViewportMetricsSync() {
  useLayoutEffect(() => {
    const onChange = () => syncViewportMetrics();

    syncViewportMetrics();

    window.visualViewport?.addEventListener("resize", onChange);
    window.visualViewport?.addEventListener("scroll", onChange);
    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", onChange);

    return () => {
      window.visualViewport?.removeEventListener("resize", onChange);
      window.visualViewport?.removeEventListener("scroll", onChange);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
      resetViewportMetrics();
    };
  }, []);

  return null;
}
