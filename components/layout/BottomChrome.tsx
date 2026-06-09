"use client";

import { usePathname } from "next/navigation";
import { TabBar } from "@/components/layout/TabBar";
import { TabPageIndicators } from "@/components/layout/TabPageIndicators";
import { useTabIndicatorsPosition } from "@/components/layout/useTabIndicatorsPosition";
import { shouldShowTabPageIndicators } from "@/lib/layout/main-tabs";

/** Chrome inferior en portal: indicadores fijos sobre la TabBar. */
export function BottomChrome() {
  const pathname = usePathname();
  const showIndicators = shouldShowTabPageIndicators(pathname);

  useTabIndicatorsPosition(showIndicators);

  return (
    <>
      {showIndicators ? (
        <div className="tm-tab-indicators-slot">
          <TabPageIndicators />
        </div>
      ) : null}
      <TabBar />
    </>
  );
}
