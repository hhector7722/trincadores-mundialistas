"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HomeViewportShellProps = {
  hero: ReactNode;
  body: ReactNode;
};

/** Inicio: scroll documento; clearance vía pb del main (Marbella). */
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
