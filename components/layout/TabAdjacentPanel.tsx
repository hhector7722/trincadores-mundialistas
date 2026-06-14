"use client";

import { useEffect, useRef, useState } from "react";
import { getTabSnapshot, hasTabSnapshot } from "@/lib/layout/tab-snapshot-cache";
import { toTabPreviewUrl } from "@/lib/layout/tab-preview";
import { TAB_SWIPE_ANIMATION_MS, TAB_SWIPE_EASING } from "@/lib/layout/tab-swipe";
import { cn } from "@/lib/utils";

type TabAdjacentPanelProps = {
  href: string;
  dragX: number;
  animating: boolean;
  side: "left" | "right";
  preload: boolean;
};

export function TabAdjacentPanel({
  href,
  dragX,
  animating,
  side,
  preload,
}: TabAdjacentPanelProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const snapshotReady = hasTabSnapshot(href);
  const [iframeReady, setIframeReady] = useState(false);

  useEffect(() => {
    setIframeReady(false);
  }, [href]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const snap = getTabSnapshot(href);
    if (snap) {
      host.replaceChildren(snap.cloneNode(true));
      return;
    }
    host.replaceChildren();
  }, [href, snapshotReady]);

  const transform =
    side === "left"
      ? `translate3d(calc(-100% + ${dragX}px), 0, 0)`
      : `translate3d(calc(100% + ${dragX}px), 0, 0)`;

  const showIframe = preload && !snapshotReady;

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
        className={cn(
          "tm-tab-swipe-adjacent-host flex h-full min-h-0 w-full flex-col bg-transparent",
          showIframe && iframeReady && "opacity-0"
        )}
      />
      {showIframe ? (
        <iframe
          title=""
          src={toTabPreviewUrl(href)}
          className={cn(
            "absolute inset-0 h-full w-full border-0 bg-transparent",
            iframeReady ? "opacity-100" : "opacity-0"
          )}
          tabIndex={-1}
          loading="eager"
          onLoad={() => setIframeReady(true)}
        />
      ) : null}
    </div>
  );
}
