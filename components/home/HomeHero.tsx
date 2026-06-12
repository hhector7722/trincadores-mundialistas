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
    <section className="tm-hero-card relative grid min-h-[11.5rem] grid-cols-2 items-stretch gap-3 overflow-hidden rounded-3xl px-5 pt-4 pb-2">
      <div className="tm-hero-card-gradient pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_15%,rgba(120,60,220,0.2)_0%,transparent_55%)]"
        aria-hidden="true"
      />

      <div className="@container/hero relative z-10 flex min-w-0 items-stretch overflow-hidden">
        <HomeHeroCarousel
          pendingCount={pendingCount}
          quizSlide={quizSlide}
          lastMatchHighlight={lastMatchHighlight}
        />
      </div>

      <div
        className="pointer-events-none relative z-[1] flex min-w-0 items-end justify-center overflow-visible"
        aria-hidden="true"
      >
        <div className="tm-hero-player-img-wrap flex w-full max-w-[10.25rem] items-end justify-center">
          <Image
            src="/icons/ronaldo.png"
            alt=""
            width={482}
            height={829}
            priority
            sizes="(max-width: 640px) 42vw, 10.25rem"
            className="block h-[12.5rem] w-auto max-w-full object-contain object-bottom mix-blend-lighten sm:h-[13.5rem]"
          />
        </div>
      </div>
    </section>
  );
}
