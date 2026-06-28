"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MatchHighlightBlock } from "@/components/highlights/MatchHighlightBlock";
import type { MatchHighlightView } from "@/lib/highlights/types";
import { cn } from "@/lib/utils";
import { teamNameEs } from "@/lib/teams/display";

type HomeHeroCarouselProps = {
  matchHighlights: MatchHighlightView[];
};

const CAROUSEL_ZONE_DOTS = ["last", "center", "right"] as const;

function resolveActiveDotIndex(activeIndex: number, focusIndex: number): number {
  if (activeIndex < focusIndex) return 0;
  if (activeIndex > focusIndex) return 2;
  return 1;
}

function generateHeadline(highlight: MatchHighlightView): string {
  const { homeTeam, awayTeam, homeGoals, awayGoals, penaltyHome, penaltyAway } = highlight;
  const homeName = teamNameEs(homeTeam);
  const awayName = teamNameEs(awayTeam);

  const isPenalty = penaltyHome != null && penaltyAway != null && penaltyHome !== penaltyAway;

  if (isPenalty) {
    const homeWon = penaltyHome > penaltyAway;
    const winnerName = homeWon ? homeName : awayName;
    return `${winnerName} gana en la tanda de penaltis y pasa a la siguiente ronda.`;
  }

  if (homeGoals > awayGoals) {
    return `${homeName} gana ${homeGoals} - ${awayGoals} y pasa a la siguiente ronda.`;
  } else if (awayGoals > homeGoals) {
    return `${awayName} gana ${awayGoals} - ${homeGoals} y pasa a la siguiente ronda.`;
  } else {
    return `Resumen del partido entre ${homeName} y ${awayName}`;
  }
}

function highlightToSlideBody(highlight: MatchHighlightView) {
  return (
    <MatchHighlightBlock
      variant="hero"
      className="w-full"
      homeTeam={highlight.homeTeam}
      awayTeam={highlight.awayTeam}
      youtubeVideoId={highlight.youtubeVideoId}
      highlightSource={highlight.source}
      headline={generateHeadline(highlight)}
    />
  );
}

export function HomeHeroCarousel({ matchHighlights }: HomeHeroCarouselProps) {
  const slides = useMemo(
    () =>
      matchHighlights.map((highlight) => ({
        id: highlight.matchId,
        highlight,
      })),
    [matchHighlights],
  );

  const defaultIndex = Math.max(0, slides.length - 1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const [scrollReady, setScrollReady] = useState(false);

  const updateActiveIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(Math.min(Math.max(index, 0), slides.length - 1));
  }, [slides.length]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || slides.length === 0) return;
    setScrollReady(false);
    el.scrollLeft = defaultIndex * el.clientWidth;
    setActiveIndex(defaultIndex);
    setScrollReady(true);
  }, [defaultIndex, slides.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateActiveIndex();
    el.addEventListener("scroll", updateActiveIndex, { passive: true });
    return () => el.removeEventListener("scroll", updateActiveIndex);
  }, [updateActiveIndex]);

  if (!slides.length) return null;

  const sizingHighlight = slides[defaultIndex]?.highlight ?? slides[0].highlight;
  const activeDotIndex = resolveActiveDotIndex(activeIndex, defaultIndex);

  return (
    <div className="flex min-w-0 flex-col" data-block-tab-swipe>
      <div className="grid min-w-0 [&>*]:col-start-1 [&>*]:row-start-1">
        <div className="invisible pointer-events-none min-w-0" aria-hidden="true">
          {highlightToSlideBody(sizingHighlight)}
        </div>
        <div
          ref={scrollRef}
          data-home-hero-carousel
          className={cn(
            "flex h-full min-h-0 w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            !scrollReady && "invisible"
          )}
          aria-roledescription="carrusel"
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="flex h-full min-h-full w-full min-w-full max-w-full shrink-0 basis-full snap-start snap-always"
              aria-hidden={index !== activeIndex}
            >
              <div className="flex h-full w-full min-w-0 max-w-full flex-col items-stretch justify-start text-left">
                {highlightToSlideBody(slide.highlight)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <div className="mt-1.5 flex h-1.5 shrink-0 items-center justify-center gap-1.5" aria-hidden>
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
  );
}
