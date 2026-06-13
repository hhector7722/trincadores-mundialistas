"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { HomeMatchCard } from "@/components/home/HomeMatchCard";
import {
  HOME_CARD_CAROUSEL_INDICATORS_SLOT_CLASS,
  HOME_CARD_SCHEDULED_BODY_H_CLASS,
  HOME_CARD_SCHEDULED_TEAMS_BLOCK_CAROUSEL_CLASS,
} from "@/components/matches/MatchTeamsDisplay";
import { buildBoardCarouselMatches } from "@/lib/predictions/board-carousel";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import { cn } from "@/lib/utils";

type HomeNextMatchProps = {
  poolId: string;
  currentProfileId: string;
  matches: MatchWithPrediction[];
};

type SlidePosition = "last" | "center" | "right";

type SlideItem = {
  id: string;
  mode: "live" | "scheduled" | "finished";
  slidePosition: SlidePosition;
  isLatestFinished: boolean;
  match: MatchWithPrediction;
};

const CAROUSEL_LAZY_RENDER_RADIUS = 1;
const CAROUSEL_ZONE_DOTS = ["last", "center", "right"] as const;

function resolveActiveDotIndex(activeIndex: number, focusIndex: number): number {
  if (activeIndex < focusIndex) return 0;
  if (activeIndex > focusIndex) return 2;
  return 1;
}

function resolveFocusIndex(matches: MatchWithPrediction[]): number {
  const liveIndex = matches.findIndex((match) => match.status === "live");
  if (liveIndex >= 0) return liveIndex;

  const nextScheduledIndex = matches.findIndex((match) => match.status === "scheduled");
  if (nextScheduledIndex >= 0) return nextScheduledIndex;

  return Math.max(0, matches.length - 1);
}

function modeForMatch(match: MatchWithPrediction): SlideItem["mode"] {
  if (match.status === "live") return "live";
  if (match.status === "finished") return "finished";
  return "scheduled";
}

export function HomeNextMatch({ poolId, currentProfileId, matches }: HomeNextMatchProps) {
  const hasLive = matches.some((match) => match.status === "live");
  const focusIndex = useMemo(() => resolveFocusIndex(matches), [matches]);

  const boardCarouselMatches = useMemo(
    () => buildBoardCarouselMatches(matches),
    [matches],
  );

  const slides = useMemo(() => {
    return matches.map((match, index) => ({
      id: match.id,
      mode: modeForMatch(match),
      slidePosition:
        index < focusIndex ? "last" : index === focusIndex ? "center" : "right",
      isLatestFinished:
        match.status === "finished" && index === focusIndex - 1 && focusIndex > 0,
      match,
    })) satisfies SlideItem[];
  }, [focusIndex, matches]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(focusIndex);

  const updateActiveIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(Math.min(Math.max(index, 0), slides.length - 1));
  }, [slides.length]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || slides.length === 0) return;
    el.scrollLeft = focusIndex * el.clientWidth;
    setActiveIndex(focusIndex);
  }, [focusIndex, slides.length]);

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
        isLatestFinished={slide.isLatestFinished}
        currentProfileId={currentProfileId}
        boardCarouselMatches={boardCarouselMatches}
        teamsBlockClassName={HOME_CARD_SCHEDULED_TEAMS_BLOCK_CAROUSEL_CLASS}
      />
    );
  }

  const activeDotIndex = resolveActiveDotIndex(activeIndex, focusIndex);

  return (
    <section className="tm-glass-card overflow-hidden p-0" data-block-tab-swipe={true}>
      <div className="px-4 pb-1 pt-1">
        <div
          ref={scrollRef}
          className={cn(
            "flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain",
            HOME_CARD_SCHEDULED_BODY_H_CLASS,
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
          aria-roledescription="carrusel"
        >
          {slides.map((slide, index) => {
            const shouldRender =
              Math.abs(index - activeIndex) <= CAROUSEL_LAZY_RENDER_RADIUS;

            return (
              <div
                key={slide.id}
                className={cn(
                  "w-full min-w-full max-w-full shrink-0 basis-full snap-start snap-always",
                  HOME_CARD_SCHEDULED_BODY_H_CLASS,
                )}
                aria-hidden={index !== activeIndex}
              >
                {shouldRender ? renderSlide(slide) : null}
              </div>
            );
          })}
        </div>

        {slides.length > 1 ? (
          <div className={HOME_CARD_CAROUSEL_INDICATORS_SLOT_CLASS} aria-hidden>
            {CAROUSEL_ZONE_DOTS.map((dotId, index) => (
              <span
                key={dotId}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === activeDotIndex ? "w-4 bg-white" : "w-1.5 bg-white/35",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
