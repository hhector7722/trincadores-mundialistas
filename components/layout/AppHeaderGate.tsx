"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { BrandLogoFixed } from "@/components/layout/BrandLogo";
import { PoolSwitcher } from "@/components/layout/PoolSwitcher";
import type { AppShellContext } from "@/lib/pool/active-pool";

export function AppHeaderGate({ ctx }: { ctx: AppShellContext }) {
  const pathname = usePathname();
  const hideBrandTitle = pathname.startsWith("/predictions");
  const isHome = pathname === "/";

  if (hideBrandTitle) {
    return (
      <header className="relative z-20 shrink-0 px-3 pb-1 pt-[max(0.375rem,env(safe-area-inset-top))]">
        <div className="flex justify-end">
          <PoolSwitcher pools={ctx.pools} activePoolId={ctx.activePoolId} />
        </div>
      </header>
    );
  }

  return (
    <>
      {isHome && <BrandLogoFixed />}
      <AppHeader ctx={ctx} stackedTitle={isHome} />
    </>
  );
}
