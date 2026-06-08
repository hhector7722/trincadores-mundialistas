import { AppHeaderGate } from "@/components/layout/AppHeaderGate";
import { NavigationLoadingProvider } from "@/components/layout/NavigationLoadingProvider";
import { TabBar } from "@/components/layout/TabBar";
import { ViewportMetricsInlineScript } from "@/components/layout/ViewportMetricsInlineScript";
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
      <div className="tm-app-shell">
        <ViewportMetricsInlineScript />
        <ViewportMetricsSync />
        <HomeAtmosphere />
        <AppHeaderGate ctx={ctx} />
        <main className="tm-app-main">{children}</main>
        <TabBar />
      </div>
    </NavigationLoadingProvider>
  );
}
