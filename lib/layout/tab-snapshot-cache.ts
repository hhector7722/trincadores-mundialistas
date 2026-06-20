const tabSnapshots = new Map<string, HTMLElement>();

export function canUseTabSnapshot(href: string): boolean {
  return href.length > 0;
}

function restoreSnapshotState(root: HTMLElement) {
  const scrollLeft = root.dataset.carouselScrollLeft;
  if (!scrollLeft) return;

  const carousel = root.querySelector<HTMLElement>("[data-home-hero-carousel]");
  if (!carousel) return;

  const left = Number(scrollLeft);
  if (!Number.isFinite(left)) return;

  carousel.scrollLeft = left;
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

  const carousel = track.querySelector<HTMLElement>("[data-home-hero-carousel]");
  if (carousel) {
    wrapper.dataset.carouselScrollLeft = String(carousel.scrollLeft);
  }

  tabSnapshots.set(href, wrapper);
}

export function mountTabSnapshot(href: string, host: HTMLElement) {
  const snap = getTabSnapshot(href);
  if (!snap) {
    host.replaceChildren();
    return false;
  }

  const clone = snap.cloneNode(true) as HTMLElement;
  host.replaceChildren(clone);
  restoreSnapshotState(clone);
  return true;
}

export function getTabSnapshot(href: string): HTMLElement | null {
  if (!canUseTabSnapshot(href)) return null;
  return tabSnapshots.get(href) ?? null;
}

export function hasTabSnapshot(href: string): boolean {
  if (!canUseTabSnapshot(href)) return false;
  return tabSnapshots.has(href);
}
