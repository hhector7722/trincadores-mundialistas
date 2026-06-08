"use client";

import { TabBar } from "@/components/layout/TabBar";
import { TabPageIndicators } from "@/components/layout/TabPageIndicators";

/** Chrome inferior fijo (portal a body): indicadores + TabBar en un solo bloque. */
export function BottomChrome() {
  return (
    <div className="tm-bottom-chrome pointer-events-none fixed bottom-0 left-0 right-0 z-[95]">
      <div className="tm-tab-indicators-slot pointer-events-none flex items-center justify-center py-1">
        <TabPageIndicators />
      </div>
      <div className="pointer-events-auto">
        <TabBar />
      </div>
    </div>
  );
}
