"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import type { AppShellContext } from "@/lib/pool/active-pool";

export function AppHeaderGate({ ctx }: { ctx: AppShellContext }) {
  const pathname = usePathname();
  const hideBrandTitle =
    pathname.startsWith("/predictions") || pathname.startsWith("/quiz/play");
  const isHome = pathname === "/";
  const isRanking = pathname === "/ranking";
  const isQuizHub = pathname === "/quiz";

  if (hideBrandTitle) {
    return null;
  }

  return (
    <AppHeader
      ctx={ctx}
      stackedTitle={isHome}
      title={
        isRanking
          ? "LA TABLA"
          : isQuizHub
            ? "¿QUIEN SABE MÁS DE LOS MUNDIALES?"
            : undefined
      }
      titleClassName={isQuizHub ? "text-sm sm:text-base" : undefined}
    />
  );
}
