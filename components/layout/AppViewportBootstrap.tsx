/** Script en <head>: métricas del visual viewport antes del primer paint. */
const APP_VIEWPORT_BOOTSTRAP = `
(function () {
  function sync() {
    var vv = window.visualViewport;
    var top = Math.round(vv ? vv.offsetTop : 0);
    var height = Math.round(vv ? vv.height : window.innerHeight);
    var root = document.documentElement;
    root.style.setProperty("--tm-app-top", top + "px");
    root.style.setProperty("--tm-app-height", height + "px");
  }

  sync();
  window.addEventListener("resize", sync);
  window.addEventListener("orientationchange", sync);
  window.addEventListener("pageshow", sync);

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", sync);
    window.visualViewport.addEventListener("scroll", sync);
  }
})();
`;

export function AppViewportBootstrap() {
  return (
    <script
      id="tm-app-viewport-bootstrap"
      dangerouslySetInnerHTML={{ __html: APP_VIEWPORT_BOOTSTRAP }}
    />
  );
}
