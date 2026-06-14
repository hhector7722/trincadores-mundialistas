"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { useTabPreviewMode } from "@/lib/layout/tab-preview";
import { useEffectiveShellPathname } from "@/lib/layout/use-effective-shell-pathname";
import { isQuizLabPath } from "@/lib/quiz/lab-access";
import type { AppShellContext } from "@/lib/pool/active-pool";

export function AppHeaderGate({ ctx }: { ctx: AppShellContext }) {
  const pathname = useEffectiveShellPathname();
  const previewMode = useTabPreviewMode();

  if (previewMode || isQuizLabPath(pathname)) {
    return null;
  }

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
      compact={isHome}
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
