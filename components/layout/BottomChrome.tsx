"use client";

import { TabBar } from "@/components/layout/TabBar";

/** TabBar fija en portal (fuera de transforms del shell). Los indicadores van en TabIndicatorsFloat. */
export function BottomChrome() {
  return (
    <div className="tm-bottom-chrome pointer-events-none fixed bottom-0 left-0 right-0 z-[95]">
      <div className="pointer-events-auto">
        <TabBar />
      </div>
    </div>
  );
}
