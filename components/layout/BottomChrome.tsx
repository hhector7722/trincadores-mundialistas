"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import { TabBar } from "@/components/layout/TabBar";
import { TabPageIndicators } from "@/components/layout/TabPageIndicators";
import { useTabIndicatorsPosition } from "@/components/layout/useTabIndicatorsPosition";
import { shouldShowTabPageIndicators } from "@/lib/layout/main-tabs";
import { VIEWPORT_CHROME_SYNC_EVENT } from "@/lib/layout/viewport-chrome";

/** Chrome inferior en portal: indicadores fijos sobre la TabBar. */
export function BottomChrome() {
  const pathname = usePathname();
  const showIndicators = shouldShowTabPageIndicators(pathname);

  useTabIndicatorsPosition(showIndicators);

  useLayoutEffect(() => {
    const sync = () => window.dispatchEvent(new Event(VIEWPORT_CHROME_SYNC_EVENT));
    sync();
    const frame = requestAnimationFrame(sync);
    return () => cancelAnimationFrame(frame);
  }, [pathname, showIndicators]);

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
