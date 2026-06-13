"use client";

import type { ReactNode } from "react";
import { ViewportLayoutRoot } from "@/components/layout/ViewportLayoutRoot";
import { cn } from "@/lib/utils";

type HomeViewportShellProps = {
  hero: ReactNode;
  body: ReactNode;
};

/**
 * Inicio: altura ajustada al contenido (hero → quiz/dato); scroll solo si desborda.
 */
export function HomeViewportShell({ hero, body }: HomeViewportShellProps) {
  return (
    <ViewportLayoutRoot
      bottomAnchor="tabbar"
      heightMode="content"
      className={cn(
        "tm-home-layout relative z-10 flex w-full flex-col overflow-x-hidden overflow-y-auto px-4 pt-2 pb-0",
      )}
    >
      <div className="tm-home-cards-stack flex w-full shrink-0 flex-col gap-3">
        <div className="tm-home-layout__hero shrink-0">{hero}</div>
        {body}
      </div>
    </ViewportLayoutRoot>
  );
}
