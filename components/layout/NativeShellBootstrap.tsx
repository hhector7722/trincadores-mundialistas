/**
 * Script bloqueante en <head>: fija métricas del viewport antes del primer paint.
 * innerHeight está disponible en <head>; evita el flash con 100svh/100dvh demasiado alto.
 */
const NATIVE_SHELL_BOOTSTRAP = `
(function () {
  var root = document.documentElement;
  root.classList.add("tm-native-shell");

  function measure() {
    var vv = window.visualViewport;
    var top = Math.round(vv ? vv.offsetTop : 0);
    var inner = window.innerHeight;
    var visual = Math.round(vv ? vv.height : inner);
    var height = Math.round(Math.min(visual, inner));
    return { top: top, height: height };
  }

  function apply(m) {
    root.style.setProperty("--tm-vvh-offset", m.top + "px");
    root.style.setProperty("--tm-vvh-height", m.height + "px");
    var body = document.body;
    if (!body) return false;
    body.style.top = m.top + "px";
    body.style.height = m.height + "px";
    return true;
  }

  function sync() {
    apply(measure());
  }

  function schedule() {
    sync();
    requestAnimationFrame(sync);
    requestAnimationFrame(function () {
      requestAnimationFrame(sync);
    });
    setTimeout(sync, 0);
    setTimeout(sync, 50);
    setTimeout(sync, 150);
    setTimeout(sync, 400);
  }

  apply(measure());

  if (!apply(measure())) {
    document.addEventListener("DOMContentLoaded", schedule);
    document.addEventListener("readystatechange", function () {
      if (document.readyState !== "loading") schedule();
    });
  } else {
    schedule();
  }

  window.addEventListener("pageshow", schedule);
  window.addEventListener("resize", sync);
  window.addEventListener("orientationchange", schedule);

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", sync);
    window.visualViewport.addEventListener("scroll", sync);
  }
})();
`;

export function NativeShellBootstrap() {
  return (
    <script
      id="tm-native-shell-bootstrap"
      dangerouslySetInnerHTML={{ __html: NATIVE_SHELL_BOOTSTRAP }}
    />
  );
}
