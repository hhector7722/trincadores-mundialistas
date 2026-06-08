/** Sincroniza el shell fijo al visual viewport real (iOS PWA). */
export function syncAppViewport(): void {
  const vv = window.visualViewport;
  const top = Math.round(vv?.offsetTop ?? 0);
  const height = Math.round(vv?.height ?? window.innerHeight);
  const root = document.documentElement;

  root.style.setProperty("--tm-app-top", `${top}px`);
  root.style.setProperty("--tm-app-height", `${height}px`);
}

export function scheduleAppViewportSync(): void {
  syncAppViewport();
  requestAnimationFrame(syncAppViewport);
  requestAnimationFrame(() => requestAnimationFrame(syncAppViewport));

  for (const delay of [50, 150, 400] as const) {
    window.setTimeout(syncAppViewport, delay);
  }
}
