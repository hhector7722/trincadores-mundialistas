"use client";

import { TabBar } from "@/components/layout/TabBar";
import { TabPageIndicators } from "@/components/layout/TabPageIndicators";

/** Chrome inferior: indicadores + TabBar al pie del shell flex. */
export function BottomChrome() {
  return (
    <div className="tm-bottom-chrome pointer-events-none shrink-0">
      <div className="tm-tab-indicators-slot pointer-events-none flex items-center justify-center py-1">
        <TabPageIndicators />
      </div>
      <div className="pointer-events-auto">
        <TabBar />
      </div>
    </div>
  );
}
