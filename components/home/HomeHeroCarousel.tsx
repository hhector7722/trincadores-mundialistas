"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type SlideCta = {
  label: string;
  href: string;
};

type Slide = {
  id: string;
  eyebrow: string;
  headline: React.ReactNode;
  description: string;
  cta?: SlideCta;
};

type HomeHeroCarouselProps = {
  pendingCount: number;
};

function buildSlides(pendingCount: number): Slide[] {
  const pendingDisplay = pendingCount > 0 ? String(pendingCount) : " ";

  return [
    {
      id: "pending",
      eyebrow: "Resultados pendientes",
      headline: (
        <p
          className="mt-0.5 max-w-full font-display text-[clamp(1.5rem,20cqw,2.75rem)] font-black leading-[0.85] tracking-tight text-[#CCFF00] drop-shadow-[0_0_32px_rgba(204,255,0,0.15)]"
          aria-label={pendingCount > 0 ? `${pendingCount} resultados pendientes` : undefined}
        >
          {pendingDisplay}
        </p>
      ),
      description: "Se cierran 5 min antes de que sonría la redonda",
      cta: { label: "Mis pronósticos", href: "/predictions" },
    },
    {
      id: "ranking",
      eyebrow: "Clasificación",
      headline: (
        <p className="mt-0.5 max-w-full font-display text-[clamp(1.125rem,11cqw,1.75rem)] font-black leading-[0.95] tracking-tight text-white">
          ¿Quién manda?
        </p>
      ),
      description: "Mira tu posición y cuánto te separa del resto",
      cta: { label: "Ver ranking", href: "/ranking" },
    },
    {
      id: "mundial",
      eyebrow: "Mundial 2026",
      headline: (
        <p className="mt-0.5 max-w-full font-display text-[clamp(1.125rem,11cqw,1.75rem)] font-black leading-[0.95] tracking-tight text-[#CCFF00]">
          104 partidos
        </p>
      ),
      description: "Una porra, un grupo y mucho que demostrar",
      cta: { label: "Ver calendario", href: "/predictions" },
    },
  ];
}

export function HomeHeroCarousel({ pendingCount }: HomeHeroCarouselProps) {
  const slides = buildSlides(pendingCount);
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

  function scrollToIndex(index: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="flex min-w-0 flex-col">
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-roledescription="carrusel"
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="w-full min-w-full max-w-full shrink-0 basis-full snap-start snap-always"
            aria-hidden={index !== activeIndex}
          >
            <div className="flex w-full min-w-0 max-w-full flex-col items-start text-left">
              <p className="max-w-full truncate text-[clamp(8px,2.2cqw,10px)] font-semibold uppercase tracking-[0.12em] text-white/60">
                {slide.eyebrow}
              </p>
              {slide.headline}
              <p className="mt-1.5 max-w-full text-[clamp(10px,2.8cqw,13px)] leading-snug text-white/50">
                {slide.description}
              </p>
              {slide.cta && (
                <Link
                  href={slide.cta.href}
                  className="mt-2 inline-flex w-fit max-w-full items-center whitespace-nowrap rounded-full bg-[#CCFF00] px-[clamp(8px,2.5cqw,10px)] py-[clamp(3px,1cqw,4px)] text-[clamp(9px,2.4cqw,10px)] font-bold uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(204,255,0,0.35)]"
                >
                  {slide.cta.label}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-2 flex items-center gap-1.5"
        role="tablist"
        aria-label="Contenido del hero"
      >
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`${slide.eyebrow}${isActive ? ", activo" : ""}`}
              onClick={() => scrollToIndex(index)}
              className={cn(
                "h-1.5 shrink-0 rounded-full transition-all duration-300 ease-out",
                isActive ? "w-4 bg-white" : "w-1.5 bg-white/35 hover:bg-white/55"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
