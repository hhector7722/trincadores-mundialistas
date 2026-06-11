import Image from "next/image";
import { HomeHeroCarousel } from "@/components/home/HomeHeroCarousel";
import type { MatchHighlightView } from "@/lib/highlights/types";
import type { HomeQuizSlide } from "@/lib/quiz/home-teaser";

type HomeHeroProps = {
  pendingCount: number;
  quizSlide: HomeQuizSlide | null;
  lastMatchHighlight: MatchHighlightView | null;
};

export function HomeHero({ pendingCount, quizSlide, lastMatchHighlight }: HomeHeroProps) {
  return (
    <section className="tm-hero-card relative grid grid-cols-[minmax(0,1fr)_8.25rem] overflow-hidden rounded-3xl px-5 pt-4 pb-2 sm:grid-cols-[minmax(0,1fr)_9rem]">
      <div className="tm-hero-card-gradient pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_15%,rgba(120,60,220,0.2)_0%,transparent_55%)]"
        aria-hidden="true"
      />

      <div className="@container/hero relative z-10 min-w-0 overflow-hidden">
        <HomeHeroCarousel
          pendingCount={pendingCount}
          quizSlide={quizSlide}
          lastMatchHighlight={lastMatchHighlight}
        />
      </div>

      <div
        className="pointer-events-none relative z-[1] min-w-0 overflow-visible"
        aria-hidden="true"
      >
        <div className="tm-hero-player-img-wrap absolute top-3 left-2 origin-top-left translate-x-3 scale-[0.88] sm:top-4 sm:left-3 sm:translate-x-4 sm:scale-[0.92]">
          <Image
            src="/icons/ronaldo.png"
            alt=""
            width={482}
            height={829}
            priority
            sizes="9.75rem"
            className="block h-[14.5rem] w-[9.75rem] max-w-none object-contain object-left-top mix-blend-lighten sm:h-[15.5rem] sm:w-[10.25rem]"
          />
        </div>
      </div>
    </section>
  );
}
