"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HomeMatchCard } from "@/components/home/HomeMatchCard";
import {
  HOME_CARD_BODY_H_CAROUSEL_CLASS,
  HOME_CARD_BODY_H_CLASS,
  HOME_CARD_CAROUSEL_INDICATORS_SLOT_CLASS,
  HOME_CARD_SCHEDULED_BODY_H_CLASS,
  HOME_CARD_SCHEDULED_TEAMS_BLOCK_CAROUSEL_CLASS,
  HOME_CARD_TEAMS_BLOCK_CAROUSEL_CLASS,
  HOME_CARD_TEAMS_BLOCK_CLASS,
} from "@/components/matches/MatchTeamsDisplay";
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
  const hasCarousel = slides.length > 1;
  const scheduledOnly = !hasCarousel && slides[0]?.mode === "scheduled";

  function teamsBlockClassNameFor(slide: SlideItem) {
    if (slide.mode === "scheduled") {
      return HOME_CARD_SCHEDULED_TEAMS_BLOCK_CAROUSEL_CLASS;
    }
    return hasCarousel ? HOME_CARD_TEAMS_BLOCK_CAROUSEL_CLASS : HOME_CARD_TEAMS_BLOCK_CLASS;
  }

  const slideBodyClassName = hasCarousel
    ? HOME_CARD_BODY_H_CAROUSEL_CLASS
    : scheduledOnly
      ? HOME_CARD_SCHEDULED_BODY_H_CLASS
      : HOME_CARD_BODY_H_CLASS;

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

  function renderSlide(slide: SlideItem) {
    return (
      <HomeMatchCard
        poolId={poolId}
        match={slide.match}
        mode={slide.mode}
        currentProfileId={currentProfileId}
        teamsBlockClassName={teamsBlockClassNameFor(slide)}
      />
    );
  }

  return (
    <section
      className="tm-glass-card overflow-hidden p-0"
      {...(hasCarousel ? { "data-block-tab-swipe": true } : {})}
    >
      <div className="px-4 pb-2 pt-2">
        {hasCarousel ? (
          <div
            ref={scrollRef}
            className={cn(
              "flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain",
              slideBodyClassName,
              "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            )}
            aria-roledescription="carrusel"
          >
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={cn(
                  "w-full min-w-full max-w-full shrink-0 basis-full snap-start snap-always",
                  slideBodyClassName,
                )}
                aria-hidden={index !== activeIndex}
              >
                {renderSlide(slide)}
              </div>
            ))}
          </div>
        ) : (
          <div className={cn(slideBodyClassName, "overflow-hidden")}>{renderSlide(slides[0]!)}</div>
        )}

        {hasCarousel ? (
          <div className={HOME_CARD_CAROUSEL_INDICATORS_SLOT_CLASS} aria-hidden>
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
        ) : null}
      </div>
    </section>
  );
}
