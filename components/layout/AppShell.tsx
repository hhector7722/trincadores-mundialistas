import { Suspense } from "react";
import { AppHeaderGate } from "@/components/layout/AppHeaderGate";
import { NavigationLoadingProvider } from "@/components/layout/NavigationLoadingProvider";
import { TabBarWrapper } from "@/components/layout/TabBarWrapper";
import { TabNavigationProvider } from "@/components/layout/TabNavigationProvider";
import { TabSwipeNavigator } from "@/components/layout/TabSwipeNavigator";
import { ViewportLayoutDebug } from "@/components/layout/ViewportLayoutDebug";
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
      <TabNavigationProvider>
        <div className="tm-app-frame">
          <div
            id="tm-safe-probe"
            className="pointer-events-none fixed left-0 top-0 -z-50 h-0 w-0 overflow-hidden pb-safe"
            aria-hidden
          />
          <HomeAtmosphere />
          <AppHeaderGate ctx={ctx} />
          <main className="tm-app-main">
            <div className="tm-app-main-inner">
              <TabSwipeNavigator>{children}</TabSwipeNavigator>
            </div>
          </main>
        </div>
        <TabBarWrapper />
        <Suspense fallback={null}>
          <ViewportLayoutDebug />
        </Suspense>
      </TabNavigationProvider>
    </NavigationLoadingProvider>
  );
}
