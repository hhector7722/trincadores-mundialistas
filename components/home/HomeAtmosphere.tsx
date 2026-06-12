"use client";

import { usePathname } from "next/navigation";
import { isQuizLabPath } from "@/lib/quiz/lab-access";

export function HomeAtmosphere() {
  const pathname = usePathname();

  if (isQuizLabPath(pathname)) {
    return null;
  }

  return (
    <div className="tm-home-atmosphere" aria-hidden="true">
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
