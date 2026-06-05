import Image from "next/image";
import { AppBrandTitle } from "@/components/layout/AppBrandTitle";

export function LoginHero() {
  return (
    <section className="tm-hero-card relative mb-5 min-h-[13rem] overflow-hidden rounded-3xl p-5 sm:min-h-[14rem]">
      <div className="tm-hero-card-gradient pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_15%,rgba(120,60,220,0.2)_0%,transparent_55%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[52%] min-w-0 pr-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">
          Mundial 2026
        </p>
        <div className="mt-1 inline-flex flex-col items-stretch">
          <h1 className="font-display text-2xl font-black uppercase leading-tight tracking-wide text-[#CCFF00] drop-shadow-[0_0_32px_rgba(204,255,0,0.15)] sm:text-[1.75rem]">
            <AppBrandTitle className="text-[#CCFF00]" />
          </h1>
          <p className="mt-2 text-center text-xs leading-relaxed text-white/50 sm:text-sm">
            Aquí lo teneis cracks
          </p>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-3 right-4 origin-top-right overflow-hidden [-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_62%,rgba(0,0,0,0.82)_74%,rgba(0,0,0,0.38)_88%,rgba(0,0,0,0)_100%)] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_62%,rgba(0,0,0,0.82)_74%,rgba(0,0,0,0.38)_88%,rgba(0,0,0,0)_100%)] sm:top-4 sm:right-5">
          <Image
            src="/icons/copa.png"
            alt=""
            width={482}
            height={829}
            priority
            sizes="(max-width: 640px) 38vw, 9rem"
            className="block h-[10.5rem] w-[7rem] max-w-none object-contain object-right-top mix-blend-lighten sm:h-[11.5rem] sm:w-[7.5rem]"
          />
        </div>
      </div>
    </section>
  );
}
