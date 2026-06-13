import Image from "next/image";
import { HomeHeroCarousel } from "@/components/home/HomeHeroCarousel";
import type { MatchHighlightView } from "@/lib/highlights/types";

type HomeHeroProps = {
  matchHighlights: MatchHighlightView[];
};

export function HomeHero({ matchHighlights }: HomeHeroProps) {
  return (
    <section className="tm-hero-card relative grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-2 overflow-hidden rounded-3xl px-5 pt-2 pb-1.5">
      <div className="tm-hero-card-gradient pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_15%,rgba(120,60,220,0.2)_0%,transparent_55%)]"
        aria-hidden="true"
      />

      <div className="@container/hero relative z-10 min-w-0 overflow-hidden">
        <HomeHeroCarousel matchHighlights={matchHighlights} />
      </div>

      <div
        className="pointer-events-none relative z-[1] min-w-0 overflow-visible"
        aria-hidden="true"
      >
        <div className="tm-hero-player-img-wrap absolute top-2 right-0 w-[8.75rem] origin-top sm:w-[9.25rem]">
          <Image
            src="/icons/ronaldo.png"
            alt=""
            width={482}
            height={829}
            priority
            sizes="8.75rem"
            className="block h-[13rem] w-[8.75rem] max-w-none object-contain object-right-top mix-blend-lighten sm:h-[14rem] sm:w-[9.25rem]"
          />
        </div>
      </div>
    </section>
  );
}
