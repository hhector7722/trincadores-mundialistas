"use client";

import { usePathname } from "next/navigation";
import { useTabNavigation } from "@/components/layout/TabNavigationProvider";

const HOME_TAB_INDEX = 2;

function getHomeAtmosphereOpacity(pathname: string, swipeProgress: number | null): number {
  if (swipeProgress != null) {
    return Math.max(0, Math.min(1, 1 - Math.abs(swipeProgress - HOME_TAB_INDEX)));
  }
  return pathname === "/" ? 1 : 0;
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
