export type ViewportMetrics = {
  offsetTop: number;
  height: number;
};

/** Altura conservadora: nunca más alta que el viewport visible real. */
export function measureViewportMetrics(): ViewportMetrics {
  const vv = window.visualViewport;
  const offsetTop = Math.round(vv?.offsetTop ?? 0);
  const inner = window.innerHeight;
  const visual = Math.round(vv?.height ?? inner);
  const height = Math.round(Math.min(visual, inner));

  return { offsetTop, height };
}

export function applyViewportMetrics(metrics: ViewportMetrics): void {
  const root = document.documentElement;
  root.style.setProperty("--tm-vvh-offset", `${metrics.offsetTop}px`);
  root.style.setProperty("--tm-vvh-height", `${metrics.height}px`);

  const body = document.body;
  if (!body) return;

  body.style.top = `${metrics.offsetTop}px`;
  body.style.height = `${metrics.height}px`;
}

/** Sincroniza body + variables CSS al visual viewport (iOS PWA / Safari). */
export function syncNativeShellViewport(): void {
  applyViewportMetrics(measureViewportMetrics());
}

export function enableNativeShell(): void {
  document.documentElement.classList.add("tm-native-shell");
  syncNativeShellViewport();
}

export function resetNativeShellViewport(): void {
  const root = document.documentElement;
  root.style.removeProperty("--tm-vvh-offset");
  root.style.removeProperty("--tm-vvh-height");
  root.classList.remove("tm-native-shell");

  const body = document.body;
  if (!body) return;

  body.style.removeProperty("top");
  body.style.removeProperty("height");
}

const VIEWPORT_SYNC_DELAYS_MS = [0, 50, 150, 400] as const;

/** Re-sincroniza tras el primer paint y cuando iOS estabiliza el viewport. */
export function scheduleNativeShellViewportSync(): void {
  syncNativeShellViewport();
  requestAnimationFrame(syncNativeShellViewport);
  requestAnimationFrame(() => requestAnimationFrame(syncNativeShellViewport));

  for (const delay of VIEWPORT_SYNC_DELAYS_MS) {
    window.setTimeout(syncNativeShellViewport, delay);
  }
}
