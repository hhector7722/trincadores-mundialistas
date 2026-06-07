import { Suspense } from "react";
import { ElasticMainScroll } from "@/components/layout/ElasticMainScroll";
import { AppHeaderGate } from "@/components/layout/AppHeaderGate";
import { TabBar } from "@/components/layout/TabBar";
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
      <ViewportMetricsSync />
      <Suspense fallback={null}>
        <ViewportLayoutDebug />
      </Suspense>
      <HomeAtmosphere />
      <AppHeaderGate ctx={ctx} />
      <main className="tm-app-main">
        <ElasticMainScroll>{children}</ElasticMainScroll>
      </main>
      <TabBar />
    </div>
  );
}
