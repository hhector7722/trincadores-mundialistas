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
  const isGeneralPredictions = pathname === "/general-predictions";
  const isQuizHub = pathname === "/quiz";
  const isProfile = pathname === "/profile";

  if (hideBrandTitle) {
    return null;
  }

  return (
    <AppHeader
      ctx={ctx}
      stackedTitle={isHome}
      showNotificationsBell={isHome}
      title={
        isRanking
          ? "LA TABLA"
          : isGeneralPredictions
            ? "PRONÓSTICOS"
            : isQuizHub
            ? "¿QUIEN SHANELA MÁS DE LOS MUNDIALES?"
            : isProfile
              ? "Perfil"
              : undefined
      }
      titleClassName={
        isQuizHub
          ? "whitespace-nowrap px-8 text-[clamp(0.5625rem,2.65vw,1rem)] leading-none"
          : undefined
      }
    />
  );
}
