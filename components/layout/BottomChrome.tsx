"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import { TabBar } from "@/components/layout/TabBar";
import { TabPageIndicators } from "@/components/layout/TabPageIndicators";
import { useTabIndicatorsPosition } from "@/components/layout/useTabIndicatorsPosition";
import { shouldShowTabPageIndicators } from "@/lib/layout/main-tabs";
import { VIEWPORT_CHROME_SYNC_EVENT } from "@/lib/layout/viewport-chrome";
import { syncViewportMetrics } from "@/lib/layout/viewport-metrics";

/** Chrome inferior en portal: indicadores fijos sobre la TabBar. */
export function BottomChrome() {
  const pathname = usePathname();
  const showIndicators = shouldShowTabPageIndicators(pathname);

  useTabIndicatorsPosition(showIndicators);

  useLayoutEffect(() => {
    const sync = () => {
      syncViewportMetrics();
      window.dispatchEvent(new Event(VIEWPORT_CHROME_SYNC_EVENT));
    };
    sync();
    const frame = requestAnimationFrame(sync);

    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);

    return () => {
      cancelAnimationFrame(frame);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
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
