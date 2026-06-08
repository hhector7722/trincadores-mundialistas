"use client";

import { useLayoutEffect } from "react";

function syncViewportMetrics() {
  const offsetTop = Math.round(window.visualViewport?.offsetTop ?? 0);
  document.documentElement.style.setProperty("--tm-vvh-offset", `${offsetTop}px`);
}

function resetViewportMetrics() {
  document.documentElement.style.removeProperty("--tm-vvh-offset");
}

/** Ajusta el top del shell al visual viewport (teclado / Safari iOS). El shell usa bottom: 0. */
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
