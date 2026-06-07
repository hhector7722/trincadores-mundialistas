"use client";

import { useEffect, useRef, type ReactNode } from "react";

const RUBBER_BAND = 0.42;
const MAX_PULL_PX = 112;
const SCROLLABLE_TOLERANCE_PX = 2;

function isElasticScrollPlatform() {
  if (typeof window === "undefined") return false;
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios || window.matchMedia("(display-mode: standalone)").matches;
}

function isModalOpen() {
  return document.documentElement.hasAttribute("data-modal-open");
}

function resistance(distance: number) {
  const sign = Math.sign(distance);
  const abs = Math.abs(distance);
  return sign * Math.min(abs * RUBBER_BAND, MAX_PULL_PX);
}

export function ElasticMainScroll({ children }: { children: ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isElasticScrollPlatform()) return;

    const inner = innerRef.current;
    const main = inner?.closest<HTMLElement>(".tm-app-main");
    if (!inner || !main) return;

    let startY = 0;
    let pullY = 0;
    let dragging = false;
    let usesTransform = false;

    const isScrollable = () =>
      main.scrollHeight > main.clientHeight + SCROLLABLE_TOLERANCE_PX;

    const resetTransform = (animate: boolean) => {
      if (!usesTransform) return;
      usesTransform = false;
      pullY = 0;
      inner.style.transition = animate
        ? "transform 0.4s cubic-bezier(0.33, 1, 0.68, 1)"
        : "none";
      inner.style.transform = "";
      if (animate) {
        const onEnd = () => {
          inner.style.transition = "";
          inner.removeEventListener("transitionend", onEnd);
        };
        inner.addEventListener("transitionend", onEnd);
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      if (isModalOpen() || event.touches.length !== 1) return;
      if (isScrollable()) {
        dragging = false;
        return;
      }
      startY = event.touches[0].clientY;
      pullY = 0;
      dragging = true;
      inner.style.transition = "none";
    };

    const onTouchMove = (event: TouchEvent) => {
      if (isModalOpen()) {
        resetTransform(true);
        dragging = false;
        return;
      }

      if (!dragging || isScrollable()) return;

      const delta = event.touches[0].clientY - startY;
      pullY = resistance(delta);
      usesTransform = pullY !== 0;
      inner.style.transform = `translate3d(0, ${pullY}px, 0)`;
    };

    const onTouchEnd = () => {
      if (!dragging) return;
      dragging = false;
      resetTransform(true);
    };

    main.addEventListener("touchstart", onTouchStart, { passive: true });
    main.addEventListener("touchmove", onTouchMove, { passive: true });
    main.addEventListener("touchend", onTouchEnd);
    main.addEventListener("touchcancel", onTouchEnd);

    return () => {
      main.removeEventListener("touchstart", onTouchStart);
      main.removeEventListener("touchmove", onTouchMove);
      main.removeEventListener("touchend", onTouchEnd);
      main.removeEventListener("touchcancel", onTouchEnd);
      resetTransform(false);
    };
  }, []);

  return <div className="tm-app-main-inner">{children}</div>;
}
