"use client";

import { useLayoutEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  collectExtendedLayoutMetrics,
  emitLayoutDebugLog,
  type ExtendedLayoutMetrics,
} from "@/lib/layout/layout-debug-metrics";

/** Overlay + logs de diagnostico: anade ?debugViewport=1 (iPhone/PWA o dev local). */
export function ViewportLayoutDebug() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const enabled = searchParams.get("debugViewport") === "1";
  const [metrics, setMetrics] = useState<ExtendedLayoutMetrics | null>(null);

  useLayoutEffect(() => {
    if (!enabled) return;

    const refresh = () => {
      const snapshot = collectExtendedLayoutMetrics(pathname);
      setMetrics(snapshot);
      emitLayoutDebugLog(snapshot, "H1-H4", "post-fix");
    };

    refresh();
    requestAnimationFrame(refresh);

    window.visualViewport?.addEventListener("resize", refresh);
    window.visualViewport?.addEventListener("scroll", refresh);
    window.addEventListener("resize", refresh);

    const main = document.querySelector<HTMLElement>(".tm-app-main");
    main?.addEventListener("scroll", refresh);

    return () => {
      window.visualViewport?.removeEventListener("resize", refresh);
      window.visualViewport?.removeEventListener("scroll", refresh);
      window.removeEventListener("resize", refresh);
      main?.removeEventListener("scroll", refresh);
    };
  }, [enabled, pathname]);

  if (!enabled || !metrics) return null;

  const chinGap = metrics.gapBelowVisual > 2 || metrics.gapBelowShell > 2 || metrics.gapBelowNav > 2;
  const scrollIssue =
    metrics.pathname === "/" &&
    metrics.mainCanScroll &&
    metrics.mainScrollHeight > metrics.mainClientHeight + 1;

  return (
    <>
      <div
        className="pointer-events-none fixed bottom-0 left-0 right-0 z-[9999] font-mono text-[10px] leading-tight text-lime-300"
        style={{ textShadow: "0 0 4px #000" }}
      >
        <div className="mx-2 mb-2 max-h-[45vh] overflow-y-auto rounded-md border border-lime-400/40 bg-black/85 p-2">
          <p className="text-lime-200">debug 95c535 · {metrics.pathname}</p>
          <p>standalone={String(metrics.standalone)} innerH={metrics.innerHeight} vv.h={metrics.vvHeight}</p>
          <p>safeBottom={metrics.safeBottom}px css frame={metrics.frameCssHeight} body={metrics.bodyCssHeight}</p>
          <p>
            frame {metrics.frameTop}→{metrics.frameBottom} (h={metrics.frameHeight})
          </p>
          <p className={chinGap ? "font-bold text-red-400" : ""}>
            gapShell={metrics.gapBelowShell}px gapVisual={metrics.gapBelowVisual}px gapBelowNav=
            {metrics.gapBelowNav}px
          </p>
          <p>
            main↓{metrics.mainBottom} chrome↑{metrics.chromeTop} gap={metrics.gapMainToChrome}px
          </p>
          <p>
            indicators {metrics.indicatorTop}→{metrics.indicatorBottom} nav↓{metrics.navBottom}
          </p>
          <p className={scrollIssue ? "font-bold text-amber-300" : ""}>
            main scroll {metrics.mainScrollTop}/{metrics.mainScrollHeight - metrics.mainClientHeight}
            px overflow={metrics.mainOverflowY} canScroll={String(metrics.mainCanScroll)}
          </p>
          <p>
            vvh vars h={metrics.vvhHeightVar} top={metrics.vvhOffsetVar}
          </p>
        </div>
      </div>
      {chinGap ? (
        <div
          className="pointer-events-none fixed left-0 right-0 z-[9998] bg-red-500/35"
          style={{ top: metrics.frameBottom, bottom: 0 }}
          aria-hidden
        />
      ) : null}
    </>
  );
}
