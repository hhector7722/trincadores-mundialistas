import Image from "next/image";
import { HomeHeroCarousel } from "@/components/home/HomeHeroCarousel";
import type { HomeQuizSlide } from "@/lib/quiz/home-teaser";

type HomeHeroProps = {
  pendingCount: number;
  quizSlide: HomeQuizSlide | null;
};

export function HomeHero({ pendingCount, quizSlide }: HomeHeroProps) {
  return (
    <section className="tm-hero-card relative grid grid-cols-[minmax(0,1fr)_9.5rem] overflow-hidden rounded-3xl px-5 pt-4 pb-2 sm:grid-cols-[minmax(0,1fr)_10.5rem]">
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
        <div className="absolute top-3 -right-2 left-0 origin-top-left scale-[1.15] overflow-hidden [-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_65%,rgba(0,0,0,0.82)_76%,rgba(0,0,0,0.38)_90%,rgba(0,0,0,0)_100%)] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_65%,rgba(0,0,0,0.82)_76%,rgba(0,0,0,0.38)_90%,rgba(0,0,0,0)_100%)] sm:top-4 sm:-right-3 sm:scale-[1.2]">
          <Image
            src="/icons/ronaldo.png"
            alt=""
            width={482}
            height={829}
            priority
            sizes="10.75rem"
            className="block h-[17rem] w-[11.5rem] max-w-none object-contain object-left-top mix-blend-lighten sm:h-[18rem] sm:w-[12rem]"
          />
        </div>
      </div>
    </section>
  );
}
