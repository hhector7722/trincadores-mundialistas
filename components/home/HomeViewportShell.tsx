"use client";

import { useRef, type ReactNode } from "react";
import { useLayoutAboveTabBar } from "@/components/layout/useLayoutAboveTabBar";
import { cn } from "@/lib/utils";

type HomeViewportShellProps = {
  hero: ReactNode;
  body: ReactNode;
};

/** Inicio: min-height medida hasta la TabBar (mismo criterio que loading). */
export function HomeViewportShell({ hero, body }: HomeViewportShellProps) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutAboveTabBar(ref, true, "tabbar", "fill");

  return (
    <div
      ref={ref}
      className={cn(
        "tm-home-layout relative z-10 flex w-full flex-1 flex-col px-4 pt-2 pb-3",
      )}
    >
      <div className="tm-home-cards-stack flex w-full flex-1 flex-col gap-3">
        <div className="tm-home-layout__hero shrink-0">{hero}</div>
        {body}
      </div>
    </div>
  );
}
