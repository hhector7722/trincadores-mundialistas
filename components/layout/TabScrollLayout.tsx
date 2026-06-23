"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TabScrollLayoutProps = {
  children: ReactNode;
  className?: string;
};

/** Scroll interno hasta la TabBar (perfil, uso, subrutas de pestaña). */
export function TabScrollLayout({ children, className }: TabScrollLayoutProps) {
  return (
    <div className={cn("tm-tab-scroll-layout", className)}>
      <div className="tm-tab-scroll-layout__viewport scroll-pb-end">
        {children}
        <div className="scroll-end-touch" aria-hidden />
      </div>
    </div>
  );
}
