"use client";

import { useEffect, useRef, useState } from "react";
import { hasTabSnapshot, mountTabSnapshot } from "@/lib/layout/tab-snapshot-cache";
import { cn } from "@/lib/utils";

type TabPanelFallbackProps = {
  href: string;
  /** Muestra spinner discreto encima mientras el RSC de la pestaña sigue pendiente. */
  pending?: boolean;
  className?: string;
};

/** Snapshot del tab visitado o spinner discreto si aún no hay caché. */
export function TabPanelFallback({ href, pending = false, className }: TabPanelFallbackProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [hasSnapshot, setHasSnapshot] = useState(() => hasTabSnapshot(href));

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const mounted = mountTabSnapshot(href, host);
    setHasSnapshot(mounted);
  }, [href]);

  const showSpinner = pending || !hasSnapshot;

  return (
    <div className={cn("relative flex h-full min-h-0 w-full flex-col bg-transparent", className)}>
      <div
        ref={hostRef}
        className="tm-tab-swipe-adjacent-host flex h-full min-h-0 w-full flex-col bg-transparent"
      />
      {showSpinner ? (
        <div
          className="tm-tab-panel-spinner pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <div className="tm-spinner tm-spinner--sm" />
        </div>
      ) : null}
    </div>
  );
}
