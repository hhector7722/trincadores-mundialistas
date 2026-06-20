"use client";

import { usePathname } from "next/navigation";
import { getMainTabSectionIndex } from "@/lib/layout/main-tabs";

function shouldShowHomeAtmosphere(pathname: string): boolean {
  return getMainTabSectionIndex(pathname) != null;
}

export function HomeAtmosphere() {
  const pathname = usePathname();
  const visible = shouldShowHomeAtmosphere(pathname);

  return (
    <div
      className="tm-home-atmosphere"
      data-active={visible ? "true" : "false"}
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 320ms ease-out",
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
