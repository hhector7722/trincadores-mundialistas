"use client";

import { ViewportLayoutRoot } from "@/components/layout/ViewportLayoutRoot";
import type { ReactNode } from "react";

type HomeViewportShellProps = {
  hero: ReactNode;
  body: ReactNode;
};

/** Inicio: altura sincronizada hasta indicadores; scroll interno acotado. */
export function HomeViewportShell({ hero, body }: HomeViewportShellProps) {
  return (
    <ViewportLayoutRoot
      bottomAnchor="indicators"
      className="tm-home-layout relative z-10 flex min-h-0 w-full flex-col gap-3 p-4 pb-0"
    >
      <div className="tm-home-layout__hero shrink-0">{hero}</div>
      {body}
    </ViewportLayoutRoot>
  );
}
