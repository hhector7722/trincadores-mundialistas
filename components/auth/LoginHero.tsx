import Image from "next/image";
import { AppBrandTitle } from "@/components/layout/AppBrandTitle";

export function LoginHero() {
  return (
    <header className="flex w-full flex-col items-center text-center">
      <Image
        src="/icons/logo.png"
        alt=""
        width={708}
        height={708}
        priority
        sizes="7rem"
        className="size-[6.5rem] rounded-2xl object-cover sm:size-28"
      />

      <h1 className="mt-4 font-display text-2xl font-black uppercase tracking-wide sm:text-[1.75rem]">
        <AppBrandTitle stacked centered className="text-[#CCFF00]" />
      </h1>

      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">
        Mundial 2026
      </p>
    </header>
  );
}
