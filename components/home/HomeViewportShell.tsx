"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HomeViewportShellProps = {
  hero: ReactNode;
  body: ReactNode;
};

/** Inicio: scroll en tm-app-main; la TabBar va en flujo al pie del shell. */
export function HomeViewportShell({ hero, body }: HomeViewportShellProps) {
  return (
    <div className={cn("tm-home-layout relative z-10 flex w-full flex-col px-4 pt-2 pb-3")}>
      <div className="tm-home-cards-stack flex w-full flex-col gap-3">
        <div className="tm-home-layout__hero shrink-0">{hero}</div>
        {body}
      </div>
    </div>
  );
}
