"use client";

import { useLayoutEffect } from "react";

function syncViewportMetrics() {
  const vv = window.visualViewport;
  const offsetTop = Math.round(vv?.offsetTop ?? 0);
  const height = Math.round(vv?.height ?? window.innerHeight);

  document.documentElement.style.setProperty("--tm-vvh-offset", `${offsetTop}px`);
  document.documentElement.style.setProperty("--tm-vvh-height", `${height}px`);
}

function resetViewportMetrics() {
  document.documentElement.style.removeProperty("--tm-vvh-offset");
  document.documentElement.style.removeProperty("--tm-vvh-height");
}

/** Alinea top + alto del shell con visualViewport (teclado, barra Safari, chin iOS). */
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
