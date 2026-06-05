import Image from "next/image";
import Link from "next/link";

type HomeHeroProps = {
  pendingCount: number;
};

export function HomeHero({ pendingCount }: HomeHeroProps) {
  const pendingDisplay = pendingCount > 0 ? String(pendingCount) : " ";

  return (
    <section className="relative min-h-[12.5rem] overflow-hidden rounded-3xl border border-white/10 bg-[#120422] px-5 pt-5 pb-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] sm:min-h-[13.5rem]">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1a0a2e] via-[#120422] to-[#060214]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_15%,rgba(90,35,175,0.12)_0%,transparent_55%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[50%] min-w-0 pr-2 sm:max-w-[52%]">
        <div className="inline-flex w-max max-w-full flex-col items-center text-center">
          <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
            Resultados pendientes
          </p>
          <p
            className="mt-0.5 font-display text-[3.25rem] font-black leading-[0.85] tracking-tight text-[#CCFF00] drop-shadow-[0_0_32px_rgba(204,255,0,0.15)] sm:text-[4rem]"
            aria-label={pendingCount > 0 ? `${pendingCount} resultados pendientes` : undefined}
          >
            {pendingDisplay}
          </p>
          <p className="mt-2 max-w-[15rem] text-xs leading-snug text-white/50 sm:max-w-[17rem] sm:text-sm">
            Se cierran 5 min antes de que sonría la redonda
          </p>
          <Link
            href="/predictions"
            className="mt-3 inline-flex w-fit items-center justify-center whitespace-nowrap rounded-full bg-[#CCFF00] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(204,255,0,0.35)]"
          >
            Mis resultados
          </Link>
        </div>
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
