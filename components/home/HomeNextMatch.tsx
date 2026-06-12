"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { HomeMatchCard } from "@/components/home/HomeMatchCard";
import {
  HOME_CARD_BODY_H_CAROUSEL_CLASS,
  HOME_CARD_CAROUSEL_INDICATORS_SLOT_CLASS,
  HOME_CARD_SCHEDULED_TEAMS_BLOCK_CAROUSEL_CLASS,
  HOME_CARD_TEAMS_BLOCK_CAROUSEL_CLASS,
} from "@/components/matches/MatchTeamsDisplay";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import { cn } from "@/lib/utils";

type HomeNextMatchProps = {
  poolId: string;
  currentProfileId: string;
  lastMatch: MatchWithPrediction | null;
  liveMatch: MatchWithPrediction | null;
  nextMatch: MatchWithPrediction | null;
  upcomingMatch: MatchWithPrediction | null;
};

type SlidePosition = "last" | "center" | "right";

type SlideItem = {
  id: string;
  mode: "live" | "scheduled" | "finished";
  slidePosition: SlidePosition;
  match: MatchWithPrediction;
};

export function HomeNextMatch({
  poolId,
  currentProfileId,
  lastMatch,
  liveMatch,
  nextMatch,
  upcomingMatch,
}: HomeNextMatchProps) {
  const hasLive = liveMatch != null;
  const centerMatch = hasLive ? liveMatch : nextMatch;
  const rightMatch = hasLive ? nextMatch : upcomingMatch;

  const slides = useMemo(() => {
    const items: SlideItem[] = [];

    if (lastMatch) {
      items.push({
        id: `last-${lastMatch.id}`,
        mode: "finished",
        slidePosition: "last",
        match: lastMatch,
      });
    }

    if (centerMatch) {
      items.push({
        id: `center-${centerMatch.id}`,
        mode: hasLive ? "live" : "scheduled",
        slidePosition: "center",
        match: centerMatch,
      });
    }

    if (rightMatch && rightMatch.id !== centerMatch?.id) {
      items.push({
        id: `right-${rightMatch.id}`,
        mode: "scheduled",
        slidePosition: "right",
        match: rightMatch,
      });
    }

    return items;
  }, [lastMatch, centerMatch, rightMatch, hasLive]);

  const defaultIndex = useMemo(
    () => Math.max(0, slides.findIndex((slide) => slide.slidePosition === "center")),
    [slides],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  function teamsBlockClassNameFor(slide: SlideItem) {
    if (slide.mode === "scheduled" || slide.mode === "finished") {
      return HOME_CARD_SCHEDULED_TEAMS_BLOCK_CAROUSEL_CLASS;
    }
    return HOME_CARD_TEAMS_BLOCK_CAROUSEL_CLASS;
  }

  const updateActiveIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(Math.min(Math.max(index, 0), slides.length - 1));
  }, [slides.length]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || slides.length === 0) return;
    el.scrollLeft = defaultIndex * el.clientWidth;
    setActiveIndex(defaultIndex);
  }, [defaultIndex, slides.length]);

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
        slidePosition={slide.slidePosition}
        hasLiveInCarousel={hasLive}
        currentProfileId={currentProfileId}
        teamsBlockClassName={teamsBlockClassNameFor(slide)}
      />
    );
  }

  return (
    <section className="tm-glass-card overflow-hidden p-0" data-block-tab-swipe={true}>
      <div className="px-4 pb-2 pt-2">
        <div
          ref={scrollRef}
          className={cn(
            "flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain",
            HOME_CARD_BODY_H_CAROUSEL_CLASS,
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
          aria-roledescription="carrusel"
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={cn(
                "w-full min-w-full max-w-full shrink-0 basis-full snap-start snap-always",
                HOME_CARD_BODY_H_CAROUSEL_CLASS,
              )}
              aria-hidden={index !== activeIndex}
            >
              {renderSlide(slide)}
            </div>
          ))}
        </div>

        {slides.length > 1 ? (
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
