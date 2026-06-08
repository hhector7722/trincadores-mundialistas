"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TabBar } from "@/components/layout/TabBar";
import { TabPageIndicators } from "@/components/layout/TabPageIndicators";

/**
 * Portal a document.body: el fixed no hereda containing blocks del shell
 * (overflow, transform, filter). Indicadores fuera y encima de la TabBar.
 */
export function TabBarWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <div className="tm-bottom-chrome pointer-events-none fixed bottom-0 left-0 right-0 z-[95]">
      <div className="tm-tab-indicators-slot pointer-events-none flex items-center justify-center py-1">
        <TabPageIndicators />
      </div>
      <div className="pointer-events-auto">
        <TabBar />
      </div>
    </div>,
    document.body
  );
}
