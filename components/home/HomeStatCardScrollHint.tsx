"use client";

import { cn } from "@/lib/utils";

type HomeStatCardScrollHintProps = {
  activeSlot: 0 | 1;
  orientation?: "horizontal" | "vertical";
};

export function HomeStatCardScrollHint({
  activeSlot,
  orientation = "horizontal",
}: HomeStatCardScrollHintProps) {
  return (
    <div
      className={cn(
        "tm-home-stat-card__scroll-hint",
        orientation === "vertical" && "tm-home-stat-card__scroll-hint--vertical"
      )}
      aria-hidden
    >
      <span
        className={cn(
          "tm-home-stat-card__scroll-hint-dot",
          activeSlot === 0 && "tm-home-stat-card__scroll-hint-dot--active"
        )}
      />
      <span
        className={cn(
          "tm-home-stat-card__scroll-hint-dot",
          activeSlot === 1 && "tm-home-stat-card__scroll-hint-dot--active"
        )}
      />
    </div>
  );
}
