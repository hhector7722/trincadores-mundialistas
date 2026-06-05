import Image from "next/image";
import { AppBrandTitle } from "@/components/layout/AppBrandTitle";

export function LoginHero() {
  return (
    <section className="tm-hero-card relative overflow-hidden rounded-3xl px-5 pt-5 pb-3">
      <div className="tm-hero-card-gradient pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_15%,rgba(120,60,220,0.2)_0%,transparent_55%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
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
          className="pointer-events-none shrink-0 overflow-hidden [-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_72%,rgba(0,0,0,0.45)_88%,rgba(0,0,0,0)_100%)] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_72%,rgba(0,0,0,0.45)_88%,rgba(0,0,0,0)_100%)]"
          aria-hidden="true"
        >
          <Image
            src="/icons/copa.png"
            alt=""
            width={482}
            height={829}
            priority
            sizes="(max-width: 640px) 28vw, 6.5rem"
            className="block h-[9rem] w-[6rem] max-w-none object-contain object-top mix-blend-lighten sm:h-[9.5rem] sm:w-[6.5rem]"
          />
        </div>
      </div>
    </section>
  );
}
