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
      emitLayoutDebugLog(snapshot, "marbella-shell", "marbella-parity");
    };

    refresh();
    requestAnimationFrame(refresh);

    window.visualViewport?.addEventListener("resize", refresh);
    window.visualViewport?.addEventListener("scroll", refresh);
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh);

    return () => {
      window.visualViewport?.removeEventListener("resize", refresh);
      window.visualViewport?.removeEventListener("scroll", refresh);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh);
    };
  }, [enabled, pathname]);

  if (!enabled || !metrics) return null;

  const chinGap = metrics.gapBelowVisual > 2 || metrics.gapBelowShell > 2 || metrics.gapBelowNav > 2;

  return (
    <>
      <div
        className="pointer-events-none fixed bottom-0 left-0 right-0 z-[9999] font-mono text-[10px] leading-tight text-lime-300"
        style={{ textShadow: "0 0 4px #000" }}
      >
        <div className="mx-2 mb-2 max-h-[45vh] overflow-y-auto rounded-md border border-lime-400/40 bg-black/85 p-2">
          <p className="text-lime-200">debug marbella · {metrics.pathname}</p>
          <p>standalone={String(metrics.standalone)} innerH={metrics.innerHeight} vv.h={metrics.vvHeight}</p>
          <p>
            safeBottom={metrics.safeBottom}px mainPb={metrics.mainPaddingBottom} body={metrics.bodyCssHeight}
          </p>
          <p>
            shell {metrics.shellTop}→{metrics.shellBottom} (h={metrics.shellHeight})
          </p>
          <p className={chinGap ? "font-bold text-red-400" : ""}>
            gapShell={metrics.gapBelowShell}px gapBelowNav={metrics.gapBelowNav}px
          </p>
          <p>
            main↓{metrics.mainBottom} chrome↑{metrics.chromeTop} gap={metrics.gapMainToChrome}px
          </p>
          <p>
            docScroll={metrics.docScrollTop} docCanScroll={String(metrics.docCanScroll)} nav=
            {metrics.navPosition}
          </p>
        </div>
      </div>
      {chinGap ? (
        <div
          className="pointer-events-none fixed left-0 right-0 z-[9998] bg-red-500/35"
          style={{ top: metrics.shellBottom, bottom: 0 }}
          aria-hidden
        />
      ) : null}
    </>
  );
}
