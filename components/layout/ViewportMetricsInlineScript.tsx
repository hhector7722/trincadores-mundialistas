import Script from "next/script";

const VIEWPORT_SYNC = `
(function () {
  function sync() {
    var top = Math.round(window.visualViewport ? window.visualViewport.offsetTop : 0);
    document.documentElement.style.setProperty("--tm-vvh-offset", top + "px");
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

/** Sincroniza offset superior antes de hidratar React (iOS PWA). */
export function ViewportMetricsInlineScript() {
  return <Script id="tm-viewport-metrics-inline" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: VIEWPORT_SYNC }} />;
}
