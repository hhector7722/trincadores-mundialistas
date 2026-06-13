"use client";

import type { ReactNode } from "react";
import { ViewportLayoutRoot } from "@/components/layout/ViewportLayoutRoot";
import { cn } from "@/lib/utils";

type HomeViewportShellProps = {
  hero: ReactNode;
  body: ReactNode;
};

/**
 * Inicio: el conjunto de cards se centra en Y (margin auto) dentro del hueco
 * cabecera fija → indicadores, sin spacers que inflen la altura del scroll.
 */
export function HomeViewportShell({ hero, body }: HomeViewportShellProps) {
  return (
    <ViewportLayoutRoot
      bottomAnchor="indicators"
      className={cn(
        "tm-home-layout relative z-10 flex min-h-0 w-full flex-col overflow-x-hidden overflow-y-auto p-4 pb-0",
      )}
    >
      <div className="tm-home-cards-stack flex w-full shrink-0 flex-col gap-3">
        <div className="tm-home-layout__hero shrink-0">{hero}</div>
        {body}
      </div>
    </ViewportLayoutRoot>
  );
}
