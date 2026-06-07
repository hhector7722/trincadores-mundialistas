"use client";

import { useLayoutEffect } from "react";

function syncViewportMetrics() {
  const viewport = window.visualViewport;

  if (viewport) {
    document.documentElement.style.setProperty("--tm-vvh-offset", `${Math.round(viewport.offsetTop)}px`);
    document.documentElement.style.setProperty("--tm-vvh-height", `${Math.round(viewport.height)}px`);
    return;
  }

  document.documentElement.style.setProperty("--tm-vvh-offset", "0px");
  document.documentElement.style.setProperty("--tm-vvh-height", `${window.innerHeight}px`);
}

function resetViewportMetrics() {
  document.documentElement.style.removeProperty("--tm-vvh-offset");
  document.documentElement.style.removeProperty("--tm-vvh-height");
}

/** Sincroniza top + alto del shell con visualViewport (iOS PWA / teclado / chrome del navegador). */
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
