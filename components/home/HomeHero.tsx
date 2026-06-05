import Image from "next/image";
import { HomeHeroCarousel } from "@/components/home/HomeHeroCarousel";

type HomeHeroProps = {
  pendingCount: number;
};

export function HomeHero({ pendingCount }: HomeHeroProps) {
  return (
    <section className="tm-hero-card relative min-h-[12.5rem] overflow-hidden rounded-3xl px-5 pt-5 pb-3 sm:min-h-[13.5rem]">
      <div className="tm-hero-card-gradient pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_15%,rgba(120,60,220,0.2)_0%,transparent_55%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[50%] min-w-0 pr-2 sm:max-w-[52%]">
        <HomeHeroCarousel pendingCount={pendingCount} />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-1 -right-8 origin-top-right scale-[1.4] overflow-hidden [-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_65%,rgba(0,0,0,0.82)_76%,rgba(0,0,0,0.38)_90%,rgba(0,0,0,0)_100%)] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_65%,rgba(0,0,0,0.82)_76%,rgba(0,0,0,0.38)_90%,rgba(0,0,0,0)_100%)] sm:-right-9 sm:scale-[1.45]">
          <Image
            src="/icons/ronaldo.png"
            alt=""
            width={482}
            height={829}
            priority
            sizes="(max-width: 640px) 58vw, 16rem"
            className="block h-[17rem] w-[11.5rem] max-w-none object-contain object-right-top mix-blend-lighten sm:h-[18rem] sm:w-[12rem]"
          />
        </div>
      </div>
    </section>
  );
}
