const tabSnapshots = new Map<string, HTMLElement>();

/** Inicio tiene carrusel/vídeo dinámico: el snapshot clonado queda en slide 0 y parpadea al montar. */
const SNAPSHOT_EXCLUDED_HREFS = new Set<string>(["/"]);

export function canUseTabSnapshot(href: string): boolean {
  return !SNAPSHOT_EXCLUDED_HREFS.has(href);
}

export function saveTabSnapshot(href: string, track: HTMLElement) {
  if (!canUseTabSnapshot(href)) {
    tabSnapshots.delete(href);
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className =
    "tm-tab-swipe-adjacent-content flex h-full min-h-0 w-full flex-col bg-transparent";
  for (const child of track.childNodes) {
    wrapper.appendChild(child.cloneNode(true));
  }
  tabSnapshots.set(href, wrapper);
}

export function getTabSnapshot(href: string): HTMLElement | null {
  if (!canUseTabSnapshot(href)) return null;
  return tabSnapshots.get(href) ?? null;
}

export function hasTabSnapshot(href: string): boolean {
  if (!canUseTabSnapshot(href)) return false;
  return tabSnapshots.has(href);
}
