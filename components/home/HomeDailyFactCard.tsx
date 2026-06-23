"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { DailyFact } from "@/lib/home/daily-fact";
import { HomeStatCardScrollHint } from "@/components/home/HomeStatCardScrollHint";

type HomeDailyFactCardProps = {
  facts: DailyFact[];
};

export function HomeDailyFactCard({ facts }: HomeDailyFactCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(Math.min(Math.max(index, 0), facts.length - 1));
  }, [facts.length]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || facts.length === 0) return;
    const lastIndex = facts.length - 1;
    el.scrollLeft = lastIndex * el.clientWidth;
    setActiveIndex(lastIndex);
  }, [facts.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateActiveIndex();
    el.addEventListener("scroll", updateActiveIndex, { passive: true });
    return () => el.removeEventListener("scroll", updateActiveIndex);
  }, [updateActiveIndex]);

  if (facts.length === 0) return null;

  return (
    <div
      className="tm-home-top-stat-card @container relative flex h-full min-h-0 min-w-0 flex-col rounded-2xl p-2 tm-stat-card transition-colors hover:bg-white/[0.06]"
      aria-label="Dato shanelador del dia"
      data-block-tab-swipe={true}
    >
      <div className="flex w-full min-w-0 flex-col gap-1.5 min-h-0 flex-1">
        <p className="shrink-0 truncate text-[9px] font-semibold uppercase tracking-wide text-[#CCFF00]">
          Dato shanelador
        </p>
        
        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          aria-roledescription="carrusel"
        >
          {facts.map((fact, index) => (
            <div
              key={fact.id}
              className="flex w-full min-w-full shrink-0 snap-center flex-col justify-start"
              aria-hidden={index !== activeIndex}
            >
              <p className="w-full min-w-0 text-[10px] font-medium leading-relaxed text-white/50">
                {fact.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {facts.length > 1 ? (
        <HomeStatCardScrollHint activeSlot={activeIndex === facts.length - 1 ? 1 : 0} />
      ) : null}
    </div>
  );
}
