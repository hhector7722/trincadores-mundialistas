"use client";

import type { ReactNode } from "react";
import { ViewportLayoutRoot } from "@/components/layout/ViewportLayoutRoot";
import { cn } from "@/lib/utils";

type HomeViewportShellProps = {
  hero: ReactNode;
  body: ReactNode;
};

/** Inicio: altura fija hasta indicadores; filas repartidas sin scroll de página. */
export function HomeViewportShell({ hero, body }: HomeViewportShellProps) {
  return (
    <ViewportLayoutRoot
      bottomAnchor="indicators"
      className={cn(
        "tm-home-layout relative z-10 flex min-h-0 w-full flex-col gap-[var(--tm-home-row-gap)] p-4 pb-0",
      )}
    >
      <div className="tm-home-layout__hero min-h-0">{hero}</div>
      <div className="tm-home-body min-h-0">{body}</div>
    </ViewportLayoutRoot>
  );
}
