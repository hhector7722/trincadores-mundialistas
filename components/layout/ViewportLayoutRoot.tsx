"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ViewportLayoutRootProps = HTMLAttributes<HTMLDivElement> & {
  className?: string;
  children: ReactNode;
};

/** Raíz de layout full-bleed: altura vía CSS calc (sin medición JS). */
export function ViewportLayoutRoot({
  className,
  children,
  ...props
}: ViewportLayoutRootProps) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}
