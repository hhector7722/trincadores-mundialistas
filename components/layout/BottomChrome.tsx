"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import { TabBar } from "@/components/layout/TabBar";
import { useTabIndicatorsPosition } from "@/components/layout/useTabIndicatorsPosition";
import { isQuizLabPath } from "@/lib/quiz/lab-access";
import { VIEWPORT_CHROME_SYNC_EVENT } from "@/lib/layout/viewport-chrome";

/** Chrome inferior en portal: TabBar con indicadores integrados. */
export function BottomChrome() {
  const pathname = usePathname();
  const hideChrome = isQuizLabPath(pathname);

  useTabIndicatorsPosition();

  useLayoutEffect(() => {
    const sync = () => window.dispatchEvent(new Event(VIEWPORT_CHROME_SYNC_EVENT));
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
  }, [pathname]);

  return hideChrome ? null : <TabBar />;
}
