"use client";

import { useRef, type HTMLAttributes, type ReactNode } from "react";
import {
  useLayoutAboveTabBar,
  type LayoutBottomAnchor,
  type LayoutHeightMode,
} from "@/components/layout/useLayoutAboveTabBar";
import { cn } from "@/lib/utils";

type ViewportLayoutRootProps = HTMLAttributes<HTMLDivElement> & {
  className?: string;
  children: ReactNode;
  bottomAnchor?: LayoutBottomAnchor;
  heightMode?: LayoutHeightMode;
};

/** Raíz de layout a pantalla completa: altura explícita hasta la TabBar o indicadores. */
export function ViewportLayoutRoot({
  className,
  children,
  bottomAnchor = "tabbar",
  heightMode = "viewport",
  ...props
}: ViewportLayoutRootProps) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutAboveTabBar(ref, true, bottomAnchor, heightMode);

  return (
    <div ref={ref} className={cn(className)} {...props}>
      {children}
    </div>
  );
}
