"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { BrandLogoFixed } from "@/components/layout/BrandLogo";
import type { AppShellContext } from "@/lib/pool/active-pool";

export function AppHeaderGate({ ctx }: { ctx: AppShellContext }) {
  const pathname = usePathname();
  const hideBrandTitle = pathname.startsWith("/predictions");
  const isHome = pathname === "/";

  if (hideBrandTitle) {
    return null;
  }

  return (
    <>
      {isHome && <BrandLogoFixed />}
      <AppHeader ctx={ctx} stackedTitle={isHome} />
    </>
  );
}
