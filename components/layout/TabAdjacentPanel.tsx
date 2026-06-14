"use client";

import { useEffect, useRef } from "react";
import { getTabSnapshot } from "@/lib/layout/tab-snapshot-cache";
import { TAB_SWIPE_ANIMATION_MS, TAB_SWIPE_EASING } from "@/lib/layout/tab-swipe";

type TabAdjacentPanelProps = {
  href: string;
  dragX: number;
  animating: boolean;
  side: "left" | "right";
};

/** Panel lateral durante el gesto: solo snapshot estático (sin iframe duplicado). */
export function TabAdjacentPanel({ href, dragX, animating, side }: TabAdjacentPanelProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const snap = getTabSnapshot(href);
    if (snap) {
      host.replaceChildren(snap.cloneNode(true));
      return;
    }
    host.replaceChildren();
  }, [href]);

  const transform =
    side === "left"
      ? `translate3d(calc(-100% + ${dragX}px), 0, 0)`
      : `translate3d(calc(100% + ${dragX}px), 0, 0)`;

  return (
    <div
      className="tm-tab-swipe-adjacent pointer-events-none absolute inset-0 z-0 overflow-hidden will-change-transform"
      style={{
        transform,
        transition: animating
          ? `transform ${TAB_SWIPE_ANIMATION_MS}ms ${TAB_SWIPE_EASING}`
          : "none",
      }}
      aria-hidden
    >
      <div
        ref={hostRef}
        className="tm-tab-swipe-adjacent-host flex h-full min-h-0 w-full flex-col bg-transparent"
      />
    </div>
  );
}
