import { Suspense } from "react";
import { ViewportMetricsInlineScript } from "@/components/layout/ViewportMetricsInlineScript";
import { ViewportLayoutDebug } from "@/components/layout/ViewportLayoutDebug";
import { ViewportMetricsSync } from "@/components/layout/ViewportMetricsSync";
import { HomeAtmosphere } from "@/components/home/HomeAtmosphere";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="tm-app-shell">
      <ViewportMetricsInlineScript />
      <ViewportMetricsSync />
      <Suspense fallback={null}>
        <ViewportLayoutDebug />
      </Suspense>
      <HomeAtmosphere />
      <main className="tm-app-main">{children}</main>
    </div>
  );
}
