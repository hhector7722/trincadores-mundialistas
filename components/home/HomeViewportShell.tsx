"use client";

import type { ReactNode } from "react";
import { HomeTabBarBuffer } from "@/components/home/HomeTabBarBuffer";
import { cn } from "@/lib/utils";

type HomeViewportShellProps = {
  hero: ReactNode;
  body: ReactNode;
};

/** Inicio: scroll en el frame; buffer inferior empuja la TabBar bajo las cards. */
export function HomeViewportShell({ hero, body }: HomeViewportShellProps) {
  return (
    <div className={cn("tm-home-layout relative z-10 flex w-full flex-col px-4 pt-2 pb-0")}>
      <div className="tm-home-cards-stack flex w-full flex-col gap-3">
        <div className="tm-home-layout__hero shrink-0">{hero}</div>
        {body}
      </div>
      <HomeTabBarBuffer />
    </div>
  );
}
