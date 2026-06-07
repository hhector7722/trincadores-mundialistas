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
    <div className="tm-app-shell">
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
      <div className="tm-app-shell-grid">
        <AppHeaderGate ctx={ctx} />
        <main className="tm-app-main">{children}</main>
      </div>
    </div>
  );
}
