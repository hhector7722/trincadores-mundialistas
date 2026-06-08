"use client";

import { useRef, type ReactNode } from "react";
import { useLayoutAboveTabBar } from "@/components/layout/useLayoutAboveTabBar";
import { cn } from "@/lib/utils";

type ViewportLayoutRootProps = {
  className?: string;
  children: ReactNode;
};

/** Raíz de layout a pantalla completa: altura explícita hasta la TabBar. */
export function ViewportLayoutRoot({ className, children }: ViewportLayoutRootProps) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutAboveTabBar(ref);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
