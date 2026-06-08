/** Sincroniza métricas del visual viewport para el shell PWA (iOS). */
export function syncViewportMetrics(): void {
  const vv = window.visualViewport;
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  const offsetTop = standalone ? 0 : Math.round(vv?.offsetTop ?? 0);
  const height = Math.round(vv?.height ?? window.innerHeight);

  const root = document.documentElement;
  root.style.setProperty("--tm-vvh-offset", `${offsetTop}px`);
  root.style.setProperty("--tm-vvh-height", `${height}px`);
}

export function resetViewportMetrics(): void {
  const root = document.documentElement;
  root.style.removeProperty("--tm-vvh-offset");
  root.style.removeProperty("--tm-vvh-height");
}
