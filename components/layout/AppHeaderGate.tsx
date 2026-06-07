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

  if (hideBrandTitle) {
    return null;
  }

  return (
    <AppHeader
      ctx={ctx}
      stackedTitle={isHome}
      title={isRanking ? "LA TABLA" : undefined}
    />
  );
}
