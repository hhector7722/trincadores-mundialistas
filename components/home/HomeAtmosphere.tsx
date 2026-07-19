"use client";

import { usePathname } from "next/navigation";
import { useTabNavigation } from "@/components/layout/TabNavigationProvider";
import { getMainTabSectionIndex, MAIN_TABS } from "@/lib/layout/main-tabs";

function shouldShowMainTabAtmosphere(pathname: string, swipeProgress: number | null): boolean {
  if (getMainTabSectionIndex(pathname) !== null) return true;
  if (swipeProgress != null) {
    const idx = Math.round(swipeProgress);
    return idx >= 0 && idx < MAIN_TABS.length;
  }
  return false;
}

function getHomeAtmosphereOpacity(pathname: string, swipeProgress: number | null): number {
  // Home final usa cielo + mock a pantalla: la atmósfera morada crea una franja oscura bajo la cabecera.
  if (pathname === "/") return 0;
  return shouldShowMainTabAtmosphere(pathname, swipeProgress) ? 1 : 0;
}

export function HomeAtmosphere() {
  const pathname = usePathname();
  const { swipeProgress } = useTabNavigation();
  const opacity = getHomeAtmosphereOpacity(pathname, swipeProgress);
  const isDragging =
    swipeProgress != null && Math.abs(swipeProgress - Math.round(swipeProgress)) > 0.02;

  return (
    <div
      className="tm-home-atmosphere"
      data-active={opacity > 0.02 ? "true" : "false"}
      style={{
        opacity,
        transition: isDragging ? "none" : "opacity 320ms ease-out",
      }}
      aria-hidden="true"
    >
      <div className="tm-home-layer-radial" />
      <div className="tm-home-layer-top-wash" />
      <div className="tm-home-layer-glow" />
      <div className="tm-home-layer-glow-secondary" />
      <div className="tm-home-layer-texture" />
      <div className="tm-home-layer-particles" />
      <div className="tm-home-layer-vignette" />
    </div>
  );
}
