"use client";

import { useLayoutEffect } from "react";
import { scheduleAppViewportSync, syncAppViewport } from "@/lib/layout/app-viewport";

/** Mantiene el shell pegado al visual viewport cuando iOS recalcula (como al hacer scroll). */
export function AppViewportSync() {
  useLayoutEffect(() => {
    const onChange = () => syncAppViewport();

    scheduleAppViewportSync();

    window.visualViewport?.addEventListener("resize", onChange);
    window.visualViewport?.addEventListener("scroll", onChange);
    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", scheduleAppViewportSync);
    window.addEventListener("pageshow", scheduleAppViewportSync);

    return () => {
      window.visualViewport?.removeEventListener("resize", onChange);
      window.visualViewport?.removeEventListener("scroll", onChange);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", scheduleAppViewportSync);
      window.removeEventListener("pageshow", scheduleAppViewportSync);
      document.documentElement.style.removeProperty("--tm-app-top");
      document.documentElement.style.removeProperty("--tm-app-height");
    };
  }, []);

  return null;
}
