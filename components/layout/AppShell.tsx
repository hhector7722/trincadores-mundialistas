import { Suspense } from "react";
import { AppHeaderGate } from "@/components/layout/AppHeaderGate";
import { NavigationLoadingProvider } from "@/components/layout/NavigationLoadingProvider";
import { TabBar } from "@/components/layout/TabBar";
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
    <NavigationLoadingProvider>
      <ViewportMetricsSync />
      <div className="tm-app-shell">
        <div
          id="tm-safe-probe"
          className="pointer-events-none fixed left-0 top-0 -z-50 h-0 w-0 overflow-hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          aria-hidden
        />
        <HomeAtmosphere />
        <AppHeaderGate ctx={ctx} />
        <main className="tm-app-main">{children}</main>
        <TabBar />
      </div>
      <Suspense fallback={null}>
        <ViewportLayoutDebug />
      </Suspense>
    </NavigationLoadingProvider>
  );
}
