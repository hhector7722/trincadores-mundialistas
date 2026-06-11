import { Suspense } from "react";
import { AppHeaderGate } from "@/components/layout/AppHeaderGate";
import { LineupsNotificationOpener } from "@/components/notifications/LineupsNotificationOpener";
import { UnreadNotificationsShell } from "@/components/notifications/UnreadNotificationsShell";
import { NavigationLoadingProvider } from "@/components/layout/NavigationLoadingProvider";
import { TabBarWrapper } from "@/components/layout/TabBarWrapper";
import { TabNavigationProvider } from "@/components/layout/TabNavigationProvider";
import { TabSwipeNavigator } from "@/components/layout/TabSwipeNavigator";
import { ViewportLayoutDebug } from "@/components/layout/ViewportLayoutDebug";
import { HomeAtmosphere } from "@/components/home/HomeAtmosphere";
import { BOTTOM_CHROME_PLACEHOLDER_ID } from "@/lib/layout/bottom-chrome";
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
      <UnreadNotificationsShell>
        <LineupsNotificationOpener />
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
              <TabSwipeNavigator>{children}</TabSwipeNavigator>
            </main>
          </div>
          <div
            id={BOTTOM_CHROME_PLACEHOLDER_ID}
            className="tm-bottom-chrome-placeholder pointer-events-none fixed bottom-0 left-0 right-0 z-[95] h-20 bg-[var(--tm-tabbar-bg-hex)] pb-safe"
            aria-hidden
          />
          <TabBarWrapper />
          <Suspense fallback={null}>
            <ViewportLayoutDebug />
          </Suspense>
        </TabNavigationProvider>
      </UnreadNotificationsShell>
    </NavigationLoadingProvider>
  );
}
