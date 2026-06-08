export type MobileOs = "android" | "ios";

/** Detecta si la PWA se ejecuta en modo instalada (standalone). */
export function isStandalonePWA(): boolean {
  if (typeof window === "undefined") return false;

  const displayModes = ["standalone", "fullscreen"] as const;
  const matchesDisplayMode = displayModes.some((mode) =>
    window.matchMedia(`(display-mode: ${mode})`).matches
  );

  const iosStandalone =
    "standalone" in window.navigator &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return matchesDisplayMode || iosStandalone;
}

/** Heurística ligera para preseleccionar el SO en el onboarding. */
export function detectMobileOs(): MobileOs | null {
  if (typeof navigator === "undefined") return null;

  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/i.test(ua)) return "ios";
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return "ios";

  return null;
}
