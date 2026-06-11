"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HomeMatchCard } from "@/components/home/HomeMatchCard";
import { HOME_CARD_BODY_MIN_H_CLASS } from "@/components/matches/MatchTeamsDisplay";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import { cn } from "@/lib/utils";

type HomeNextMatchProps = {
  poolId: string;
  currentProfileId: string;
  liveMatch: MatchWithPrediction | null;
  nextMatch: MatchWithPrediction | null;
};

type SlideItem = {
  id: string;
  mode: "live" | "scheduled";
  match: MatchWithPrediction;
};

export function HomeNextMatch({
  poolId,
  currentProfileId,
  liveMatch,
  nextMatch,
}: HomeNextMatchProps) {
  const slides = useMemo(() => {
    const items: SlideItem[] = [];
    if (liveMatch) items.push({ id: `live-${liveMatch.id}`, mode: "live", match: liveMatch });
    if (nextMatch && nextMatch.id !== liveMatch?.id) {
      items.push({ id: `next-${nextMatch.id}`, mode: "scheduled", match: nextMatch });
    }
    return items;
  }, [liveMatch, nextMatch]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(Math.min(Math.max(index, 0), slides.length - 1));
  }, [slides.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateActiveIndex();
    el.addEventListener("scroll", updateActiveIndex, { passive: true });
    return () => el.removeEventListener("scroll", updateActiveIndex);
  }, [updateActiveIndex]);

  if (!slides.length) return null;

  if (slides.length === 1) {
    const slide = slides[0]!;
    return (
      <section className="tm-glass-card overflow-hidden p-0">
        <div className="px-4 pb-2 pt-2">
          <HomeMatchCard
            poolId={poolId}
            match={slide.match}
            mode={slide.mode}
            currentProfileId={currentProfileId}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="tm-glass-card overflow-hidden p-0" data-block-tab-swipe>
      <div className="px-4 pb-2 pt-2">
        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-roledescription="carrusel"
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={cn(
                "w-full min-w-full max-w-full shrink-0 basis-full snap-start snap-always",
                HOME_CARD_BODY_MIN_H_CLASS,
              )}
              aria-hidden={index !== activeIndex}
            >
              <HomeMatchCard
                poolId={poolId}
                match={slide.match}
                mode={slide.mode}
                currentProfileId={currentProfileId}
              />
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-center gap-1.5" aria-hidden>
          {slides.map((slide, index) => (
            <span
              key={slide.id}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/35",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
