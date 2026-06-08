import Image from "next/image";
import { HomeHeroCarousel } from "@/components/home/HomeHeroCarousel";
import type { HomeQuizSlide } from "@/lib/quiz/home-teaser";

type HomeHeroProps = {
  pendingCount: number;
  quizSlide: HomeQuizSlide | null;
};

export function HomeHero({ pendingCount, quizSlide }: HomeHeroProps) {
  return (
    <section className="tm-hero-card relative grid grid-cols-[minmax(0,1fr)_8.25rem] overflow-hidden rounded-3xl px-5 pt-4 pb-2 sm:grid-cols-[minmax(0,1fr)_9rem]">
      <div className="tm-hero-card-gradient pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_15%,rgba(120,60,220,0.2)_0%,transparent_55%)]"
        aria-hidden="true"
      />

      <div className="@container/hero relative z-10 min-w-0 overflow-hidden">
        <HomeHeroCarousel pendingCount={pendingCount} quizSlide={quizSlide} />
      </div>

      <div
        className="pointer-events-none relative z-[1] min-w-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-3 left-2 origin-top-left translate-x-3 scale-[0.88] overflow-hidden [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_28%,rgba(0,0,0,0.96)_40%,rgba(0,0,0,0.86)_52%,rgba(0,0,0,0.68)_64%,rgba(0,0,0,0.46)_76%,rgba(0,0,0,0.24)_88%,rgba(0,0,0,0.08)_95%,transparent_100%)] [mask-image:linear-gradient(to_bottom,#000_0%,#000_28%,rgba(0,0,0,0.96)_40%,rgba(0,0,0,0.86)_52%,rgba(0,0,0,0.68)_64%,rgba(0,0,0,0.46)_76%,rgba(0,0,0,0.24)_88%,rgba(0,0,0,0.08)_95%,transparent_100%)] sm:top-4 sm:left-3 sm:translate-x-4 sm:scale-[0.92]">
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
        <div className="absolute inset-x-0 bottom-0 z-[2] h-12 bg-gradient-to-t from-[rgba(48,21,96,0.92)] via-[rgba(48,21,96,0.45)] to-transparent sm:h-14" />
      </div>
    </section>
  );
}
