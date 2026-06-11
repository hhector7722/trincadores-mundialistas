import Script from "next/script";

const VIEWPORT_SYNC = `
(function () {
  function sync() {
    var vv = window.visualViewport;
    var standalone = window.matchMedia("(display-mode: standalone)").matches;
    var top = standalone ? 0 : Math.round(vv ? vv.offsetTop : 0);
    var height = Math.round(vv ? vv.height : window.innerHeight);
    var root = document.documentElement;
    root.style.setProperty("--tm-vvh-offset", top + "px");
    root.style.setProperty("--tm-vvh-height", height + "px");
  }

  sync();
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", sync);
    window.visualViewport.addEventListener("scroll", sync);
  }
  window.addEventListener("resize", sync);
  window.addEventListener("orientationchange", sync);
})();
`;

/** Sincroniza altura/offset del viewport antes de hidratar React (iOS PWA). */
export function ViewportMetricsInlineScript() {
  return (
    <Script
      id="tm-viewport-metrics-inline"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: VIEWPORT_SYNC }}
    />
  );
}
