export type ExtendedLayoutMetrics = {
  pathname: string;
  standalone: boolean;
  innerHeight: number;
  vvHeight: number;
  vvOffsetTop: number;
  visualBottom: number;
  safeBottom: number;
  frameTop: number;
  frameBottom: number;
  frameHeight: number;
  frameCssHeight: string;
  bodyCssHeight: string;
  gapBelowShell: number;
  gapBelowVisual: number;
  mainBottom: number;
  chromeTop: number;
  chromeBottom: number;
  navBottom: number;
  gapMainToChrome: number;
  gapBelowNav: number;
  indicatorTop: number;
  indicatorBottom: number;
  homeScrollHeight: number;
  homeClientHeight: number;
  homeScrollTop: number;
  homeCanScroll: boolean;
  homeOverflowY: string;
  homeContentOverflow: number;
  mainScrollHeight: number;
  mainClientHeight: number;
  mainScrollTop: number;
  mainCanScroll: boolean;
  mainOverflowY: string;
  vvhHeightVar: string;
  vvhOffsetVar: string;
};

function readSafeBottom(): number {
  const probe = document.getElementById("tm-safe-probe");
  if (!probe) return 0;
  return parseFloat(getComputedStyle(probe).paddingBottom) || 0;
}

export function collectExtendedLayoutMetrics(pathname: string): ExtendedLayoutMetrics {
  const vv = window.visualViewport;
  const frame = document.querySelector<HTMLElement>(".tm-app-frame");
  const main = document.querySelector<HTMLElement>(".tm-app-main");
  const chrome = document.querySelector<HTMLElement>(".tm-bottom-chrome");
  const nav = document.querySelector<HTMLElement>("nav[aria-label='Navegacion principal']");
  const indicators = document.querySelector<HTMLElement>(".tm-tab-indicators-slot");
  const home = document.querySelector<HTMLElement>(".tm-home-layout");
  const root = document.documentElement;

  const frameRect = frame?.getBoundingClientRect();
  const mainRect = main?.getBoundingClientRect();
  const chromeRect = chrome?.getBoundingClientRect();
  const navRect = nav?.getBoundingClientRect();
  const indicatorRect = indicators?.getBoundingClientRect();
  const visualBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;

  const homeScrollHeight = home?.scrollHeight ?? 0;
  const homeClientHeight = home?.clientHeight ?? 0;
  const homeScrollTop = home?.scrollTop ?? 0;

  return {
    pathname,
    standalone: window.matchMedia("(display-mode: standalone)").matches,
    innerHeight: window.innerHeight,
    vvHeight: Math.round(vv?.height ?? 0),
    vvOffsetTop: Math.round(vv?.offsetTop ?? 0),
    visualBottom: Math.round(visualBottom),
    safeBottom: Math.round(readSafeBottom()),
    frameTop: Math.round(frameRect?.top ?? 0),
    frameBottom: Math.round(frameRect?.bottom ?? 0),
    frameHeight: Math.round(frameRect?.height ?? 0),
    frameCssHeight: frame ? getComputedStyle(frame).height : "n/a",
    bodyCssHeight: getComputedStyle(document.body).height,
    gapBelowShell: Math.round(window.innerHeight - (frameRect?.bottom ?? 0)),
    gapBelowVisual: Math.round(visualBottom - (frameRect?.bottom ?? 0)),
    mainBottom: Math.round(mainRect?.bottom ?? 0),
    chromeTop: Math.round(chromeRect?.top ?? 0),
    chromeBottom: Math.round(chromeRect?.bottom ?? 0),
    navBottom: Math.round(navRect?.bottom ?? 0),
    gapMainToChrome: Math.round((chromeRect?.top ?? 0) - (mainRect?.bottom ?? 0)),
    gapBelowNav: Math.round(visualBottom - (navRect?.bottom ?? 0)),
    indicatorTop: Math.round(indicatorRect?.top ?? 0),
    indicatorBottom: Math.round(indicatorRect?.bottom ?? 0),
    homeScrollHeight,
    homeClientHeight,
    homeScrollTop,
    homeCanScroll: homeScrollHeight > homeClientHeight + 1,
    homeOverflowY: home ? getComputedStyle(home).overflowY : "n/a",
    homeContentOverflow: homeScrollHeight - homeClientHeight,
    mainScrollHeight: main?.scrollHeight ?? 0,
    mainClientHeight: main?.clientHeight ?? 0,
    mainScrollTop: main?.scrollTop ?? 0,
    mainCanScroll: (main?.scrollHeight ?? 0) > (main?.clientHeight ?? 0) + 1,
    mainOverflowY: main ? getComputedStyle(main).overflowY : "n/a",
    vvhHeightVar: root.style.getPropertyValue("--tm-vvh-height") || "unset",
    vvhOffsetVar: root.style.getPropertyValue("--tm-vvh-offset") || "unset",
  };
}

const DEBUG_ENDPOINT =
  "http://127.0.0.1:7725/ingest/7b4f04a1-d178-4c48-be4c-a3d76b5e017d";
const DEBUG_SESSION = "95c535";

/** Envía métricas al colector local (dev) y devuelve el payload. */
export function emitLayoutDebugLog(
  metrics: ExtendedLayoutMetrics,
  hypothesisId: string,
  runId = "pre-fix"
): ExtendedLayoutMetrics {
  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": DEBUG_SESSION,
    },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION,
      runId,
      hypothesisId,
      location: "lib/layout/layout-debug-metrics.ts:emitLayoutDebugLog",
      message: "layout metrics snapshot",
      data: metrics,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  return metrics;
}
