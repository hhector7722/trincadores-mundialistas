"use client";

import { cn } from "@/lib/utils";

type HomeStatCardScrollHintProps = {
  activeSlot: 0 | 1;
};

export function HomeStatCardScrollHint({ activeSlot }: HomeStatCardScrollHintProps) {
  return (
    <div className="tm-home-stat-card__scroll-hint" aria-hidden>
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
