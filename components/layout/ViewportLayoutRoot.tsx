"use client";

import { useRef, type ReactNode } from "react";
import {
  useLayoutAboveTabBar,
  type LayoutBottomAnchor,
} from "@/components/layout/useLayoutAboveTabBar";
import { cn } from "@/lib/utils";

type ViewportLayoutRootProps = {
  className?: string;
  children: ReactNode;
  bottomAnchor?: LayoutBottomAnchor;
};

/** Raíz de layout a pantalla completa: altura explícita hasta la TabBar o indicadores. */
export function ViewportLayoutRoot({
  className,
  children,
  bottomAnchor = "tabbar",
}: ViewportLayoutRootProps) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutAboveTabBar(ref, true, bottomAnchor);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
