import { AppHeaderGate } from "@/components/layout/AppHeaderGate";
import { TabBar } from "@/components/layout/TabBar";
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
      <ViewportMetricsSync />
      <HomeAtmosphere />
      <AppHeaderGate ctx={ctx} />
      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        {children}
      </main>
      <TabBar />
    </div>
  );
}
