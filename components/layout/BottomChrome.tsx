"use client";

import { TabBar } from "@/components/layout/TabBar";
import { TabPageIndicators } from "@/components/layout/TabPageIndicators";
import { useTabIndicatorsPosition } from "@/components/layout/useTabIndicatorsPosition";

/** Chrome inferior en portal: indicadores fijos sobre la TabBar. */
export function BottomChrome() {
  useTabIndicatorsPosition();

  return (
    <>
      <div className="tm-tab-indicators-slot">
        <TabPageIndicators />
      </div>
      <TabBar />
    </>
  );
}
