"use client";

import { useLayoutEffect } from "react";

function syncViewportOffset() {
  const offsetTop = Math.round(window.visualViewport?.offsetTop ?? 0);
  document.documentElement.style.setProperty("--tm-vvh-offset", `${offsetTop}px`);
}

function resetViewportOffset() {
  document.documentElement.style.removeProperty("--tm-vvh-offset");
}

/** Alinea el shell con visualViewport.offsetTop (teclado / barra del navegador). */
export function ViewportMetricsSync() {
  useLayoutEffect(() => {
    const onChange = () => syncViewportOffset();

    syncViewportOffset();

    window.visualViewport?.addEventListener("resize", onChange);
    window.visualViewport?.addEventListener("scroll", onChange);
    window.addEventListener("orientationchange", onChange);

    return () => {
      window.visualViewport?.removeEventListener("resize", onChange);
      window.visualViewport?.removeEventListener("scroll", onChange);
      window.removeEventListener("orientationchange", onChange);
      resetViewportOffset();
    };
  }, []);

  return null;
}
