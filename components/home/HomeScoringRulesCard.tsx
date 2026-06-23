"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SCORING_RULES_MODAL_SECTIONS } from "@/lib/home/scoring-rules-content";
import { HomeStatCardScrollHint } from "@/components/home/HomeStatCardScrollHint";

type HomeScoringRulesCardProps = {
  className?: string;
};

export function HomeScoringRulesCard({ className }: HomeScoringRulesCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(Math.min(Math.max(index, 0), SCORING_RULES_MODAL_SECTIONS.length - 1));
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || SCORING_RULES_MODAL_SECTIONS.length === 0) return;
    el.scrollLeft = 0;
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateActiveIndex();
    el.addEventListener("scroll", updateActiveIndex, { passive: true });
    return () => el.removeEventListener("scroll", updateActiveIndex);
  }, [updateActiveIndex]);

  return (
    <div
      className="tm-home-top-stat-card @container relative flex h-full min-h-0 min-w-0 flex-col rounded-2xl p-2 tm-stat-card transition-colors hover:bg-white/[0.06]"
      aria-label="Normas de puntuación"
      data-block-tab-swipe={true}
    >
      <div className="flex w-full min-w-0 flex-col gap-1 min-h-0 flex-1">
        <p className="shrink-0 truncate text-[9px] font-semibold uppercase tracking-wide text-[#CCFF00]">
          {SCORING_RULES_MODAL_SECTIONS[activeIndex]?.title ?? "Normas"}
        </p>
        
        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          aria-roledescription="carrusel"
        >
          {SCORING_RULES_MODAL_SECTIONS.map((section, index) => (
            <div
              key={section.id}
              className="flex w-full min-w-full shrink-0 snap-center flex-col justify-start"
              aria-hidden={index !== activeIndex}
            >
              <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain">
                {section.body.map((line, i) => (
                  <li key={i} className="flex gap-1.5 text-[9px] font-medium leading-relaxed text-white/50">
                    <span
                      className="mt-1.5 h-0.5 w-0.5 shrink-0 rounded-full bg-[#CCFF00]"
                      aria-hidden="true"
                    />
                    <span className="min-w-0">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {SCORING_RULES_MODAL_SECTIONS.length > 1 ? (
        <HomeStatCardScrollHint activeSlot={activeIndex === 0 ? 0 : 1} />
      ) : null}
    </div>
  );
}
