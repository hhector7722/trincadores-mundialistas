"use client";

import type { ReactNode } from "react";
import { TabPanelFallback } from "@/components/layout/TabPanelFallback";
import { TAB_SWIPE_ANIMATION_MS, TAB_SWIPE_EASING } from "@/lib/layout/tab-swipe";

type TabAdjacentPanelProps = {
  href: string;
  dragX: number;
  animating: boolean;
  side: "left" | "right";
};

/** Panel lateral durante el gesto: snapshot estático del tab vecino. */
export function TabAdjacentPanel({ href, dragX, animating, side }: TabAdjacentPanelProps) {
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
      <TabPanelFallback href={href} />
    </div>
  );
}

type TabTransitionIncomingProps = {
  href: string;
  dragX: number;
  side: "left" | "right";
  animating: boolean;
  liveContent: ReactNode;
  liveReady: boolean;
  pending: boolean;
};

/** Panel entrante durante commit de pestaña: snapshot hasta que el RSC esté listo. */
export function TabTransitionIncoming({
  href,
  dragX,
  side,
  animating,
  liveContent,
  liveReady,
  pending,
}: TabTransitionIncomingProps) {
  const transform =
    side === "left"
      ? `translate3d(calc(-100% + ${dragX}px), 0, 0)`
      : `translate3d(calc(100% + ${dragX}px), 0, 0)`;

  return (
    <div
      className="tm-tab-swipe-incoming pointer-events-none absolute inset-0 z-0 overflow-hidden will-change-transform"
      style={{
        transform,
        transition: animating
          ? `transform ${TAB_SWIPE_ANIMATION_MS}ms ${TAB_SWIPE_EASING}`
          : "none",
      }}
      aria-hidden={!liveReady}
    >
      {liveReady ? (
        <div className="tm-tab-swipe-incoming-live flex h-full min-h-0 w-full flex-col bg-transparent">
          {liveContent}
        </div>
      ) : (
        <TabPanelFallback href={href} pending={pending} />
      )}
    </div>
  );
}
