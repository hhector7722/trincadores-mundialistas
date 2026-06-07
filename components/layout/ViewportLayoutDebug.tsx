"use client";

import { useLayoutEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type LayoutMetrics = {
  vvHeight: number;
  vvOffsetTop: number;
  innerHeight: number;
  safeBottom: number;
  shellTop: number;
  shellBottom: number;
  shellHeight: number;
  tabbarTop: number;
  tabbarBottom: number;
  tabbarHeight: number;
  gapBelowTabbar: number;
  gapBelowShell: number;
  gapBelowVisual: number;
  cssTabbarHeight: string;
  shellCssHeight: string;
};

function readSafeBottom(): number {
  const probe = document.getElementById("tm-safe-probe");
  if (!probe) return 0;
  return parseFloat(getComputedStyle(probe).paddingBottom) || 0;
}

function collectMetrics(): LayoutMetrics {
  const vv = window.visualViewport;
  const shell = document.querySelector<HTMLElement>(".tm-app-shell");
  const tabbar = document.querySelector<HTMLElement>(".tm-tabbar");
  const shellRect = shell?.getBoundingClientRect();
  const tabbarRect = tabbar?.getBoundingClientRect();
  const visualBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
  const dvhProbe = document.querySelector<HTMLElement>(".tm-app-shell");

  return {
    vvHeight: Math.round(vv?.height ?? 0),
    vvOffsetTop: Math.round(vv?.offsetTop ?? 0),
    innerHeight: window.innerHeight,
    safeBottom: Math.round(readSafeBottom()),
    shellTop: Math.round(shellRect?.top ?? 0),
    shellBottom: Math.round(shellRect?.bottom ?? 0),
    shellHeight: Math.round(shellRect?.height ?? 0),
    tabbarTop: Math.round(tabbarRect?.top ?? 0),
    tabbarBottom: Math.round(tabbarRect?.bottom ?? 0),
    tabbarHeight: Math.round(tabbarRect?.height ?? 0),
    gapBelowTabbar: Math.round(window.innerHeight - (tabbarRect?.bottom ?? 0)),
    gapBelowShell: Math.round(window.innerHeight - (shellRect?.bottom ?? 0)),
    gapBelowVisual: Math.round(visualBottom - (tabbarRect?.bottom ?? 0)),
    cssTabbarHeight: getComputedStyle(document.documentElement).getPropertyValue("--tm-tabbar-height").trim(),
    shellCssHeight: dvhProbe ? getComputedStyle(dvhProbe).height : "n/a",
  };
}

/** Overlay de diagnostico: anade ?debugViewport=1 a la URL en iPhone/PWA. */
export function ViewportLayoutDebug() {
  const searchParams = useSearchParams();
  const enabled = searchParams.get("debugViewport") === "1";
  const [metrics, setMetrics] = useState<LayoutMetrics | null>(null);

  useLayoutEffect(() => {
    if (!enabled) return;

    const refresh = () => setMetrics(collectMetrics());
    refresh();

    window.visualViewport?.addEventListener("resize", refresh);
    window.visualViewport?.addEventListener("scroll", refresh);
    window.addEventListener("resize", refresh);

    return () => {
      window.visualViewport?.removeEventListener("resize", refresh);
      window.visualViewport?.removeEventListener("scroll", refresh);
      window.removeEventListener("resize", refresh);
    };
  }, [enabled]);

  if (!enabled || !metrics) return null;

  const chinGap = metrics.gapBelowVisual > 0 || metrics.gapBelowTabbar > 0;

  return (
    <>
      <div
        className="pointer-events-none fixed bottom-0 left-0 right-0 z-[9999] font-mono text-[10px] leading-tight text-lime-300"
        style={{ textShadow: "0 0 4px #000" }}
      >
        <div className="mx-2 mb-2 rounded-md border border-lime-400/40 bg-black/80 p-2">
          <p>vv.h={metrics.vvHeight} vv.top={metrics.vvOffsetTop} innerH={metrics.innerHeight}</p>
          <p>safeBottom={metrics.safeBottom}px</p>
          <p>
            shell {metrics.shellTop}→{metrics.shellBottom} (h={metrics.shellHeight} css={metrics.shellCssHeight})
          </p>
          <p>
            tabbar {metrics.tabbarTop}→{metrics.tabbarBottom} (h={metrics.tabbarHeight}) css={metrics.cssTabbarHeight}
          </p>
          <p className={chinGap ? "font-bold text-red-400" : ""}>
            gapVisual={metrics.gapBelowVisual}px gapInner={metrics.gapBelowTabbar}px gapShell=
            {metrics.gapBelowShell}px
          </p>
        </div>
      </div>
      {chinGap ? (
        <div
          className="pointer-events-none fixed left-0 right-0 z-[9998] bg-red-500/35"
          style={{ top: metrics.tabbarBottom, bottom: 0 }}
          aria-hidden
        />
      ) : null}
    </>
  );
}
