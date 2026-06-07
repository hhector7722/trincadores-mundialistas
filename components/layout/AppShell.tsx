import { Suspense } from "react";
import { AppHeaderGate } from "@/components/layout/AppHeaderGate";
import { ViewportMetricsInlineScript } from "@/components/layout/ViewportMetricsInlineScript";
import { ViewportLayoutDebug } from "@/components/layout/ViewportLayoutDebug";
import { ViewportMetricsSync } from "@/components/layout/ViewportMetricsSync";
import { HomeAtmosphere } from "@/components/home/HomeAtmosphere";
import type { AppShellContext } from "@/lib/pool/active-pool";

export function AppShell({
  ctx,
  children,
}: {
  ctx: AppShellContext;
  children: React.ReactNode;
}) {
  return (
    <div className="tm-app-shell relative flex flex-col">
      <ViewportMetricsInlineScript />
      <div
        id="tm-safe-probe"
        className="pointer-events-none fixed bottom-0 left-0 h-0 w-0 pb-[env(safe-area-inset-bottom)]"
        aria-hidden
      />
      <ViewportMetricsSync />
      <Suspense fallback={null}>
        <ViewportLayoutDebug />
      </Suspense>
      <HomeAtmosphere />
      <AppHeaderGate ctx={ctx} />
      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain bg-[var(--tm-shell-bg-hex)]">
        {children}
      </main>
    </div>
  );
}
