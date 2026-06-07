"use client";

import { useLayoutEffect } from "react";

function syncViewportMetrics() {
  const vv = window.visualViewport;
  const height = Math.round(vv?.height ?? window.innerHeight);
  const offsetTop = Math.round(vv?.offsetTop ?? 0);

  document.documentElement.style.setProperty("--tm-vvh", `${height}px`);
  document.documentElement.style.setProperty("--tm-vvh-offset", `${offsetTop}px`);
}

function resetViewportMetrics() {
  document.documentElement.style.removeProperty("--tm-vvh");
  document.documentElement.style.removeProperty("--tm-vvh-offset");
}

/** Sincroniza altura visible real (visualViewport) para evitar huecos arriba/abajo en móvil/PWA. */
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
