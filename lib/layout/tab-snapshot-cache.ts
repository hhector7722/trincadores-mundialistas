const tabSnapshots = new Map<string, HTMLElement>();

export function saveTabSnapshot(href: string, track: HTMLElement) {
  const wrapper = document.createElement("div");
  wrapper.className =
    "tm-tab-swipe-adjacent-content flex h-full min-h-0 w-full flex-col bg-transparent";
  for (const child of track.childNodes) {
    wrapper.appendChild(child.cloneNode(true));
  }
  tabSnapshots.set(href, wrapper);
}

export function getTabSnapshot(href: string): HTMLElement | null {
  return tabSnapshots.get(href) ?? null;
}

export function hasTabSnapshot(href: string): boolean {
  return tabSnapshots.has(href);
}
