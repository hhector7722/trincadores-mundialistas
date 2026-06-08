"use client";

import { TabPageIndicators } from "@/components/layout/TabPageIndicators";

/** Indicadores dentro del shell: flotan sobre el degradado de la página, no sobre la TabBar. */
export function TabIndicatorsFloat() {
  return (
    <div
      className="tm-tab-indicators-float pointer-events-none fixed inset-x-0 z-[90] flex items-center justify-center"
    >
      <TabPageIndicators />
    </div>
  );
}
