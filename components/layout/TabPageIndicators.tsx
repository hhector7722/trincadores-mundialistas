"use client";

import { usePathname } from "next/navigation";
import { MAIN_TABS, shouldShowTabPageIndicators } from "@/lib/layout/main-tabs";
import { cn } from "@/lib/utils";
import {
  useTabIndicatorProgress,
  useTabNavigation,
} from "@/components/layout/TabNavigationProvider";

import { TAB_INDICATOR_DOT_SIZE } from "@/lib/layout/tab-indicators-position";

const DOT_SIZE = TAB_INDICATOR_DOT_SIZE;
const ACTIVE_WIDTH = 18;
const GAP = 6;

export function TabPageIndicators() {
  const pathname = usePathname();
  const progress = useTabIndicatorProgress();
  const { swipeProgress, activeIndex } = useTabNavigation();

  if (!shouldShowTabPageIndicators(pathname) || activeIndex == null) return null;
  const trackWidth =
    MAIN_TABS.length * DOT_SIZE + (MAIN_TABS.length - 1) * GAP - DOT_SIZE + ACTIVE_WIDTH;
  const pillLeft = progress * (DOT_SIZE + GAP);
  const isDragging = swipeProgress != null;

  return (
    <div
      className="flex shrink-0 items-center justify-center"
      role="tablist"
      aria-label="Secciones principales"
    >
      <div className="relative" style={{ width: trackWidth, height: DOT_SIZE }}>
        {MAIN_TABS.map((tab, index) => (
          <span
            key={tab.href}
            className="absolute top-0 rounded-full bg-white/30"
            style={{
              left: index * (DOT_SIZE + GAP),
              width: DOT_SIZE,
              height: DOT_SIZE,
            }}
            aria-hidden
          />
        ))}
        <span
          className={cn(
            "absolute top-0 rounded-full bg-[var(--tm-accent)]",
            "shadow-[0_0_10px_rgba(217,255,0,0.45)]",
            !isDragging && "transition-[left] duration-200 ease-out"
          )}
          style={{
            left: pillLeft,
            width: ACTIVE_WIDTH,
            height: DOT_SIZE,
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}
