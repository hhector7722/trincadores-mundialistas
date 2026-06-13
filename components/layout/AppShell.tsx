import { Suspense } from "react";
import { AppHeaderGate } from "@/components/layout/AppHeaderGate";
import { LineupsNotificationOpener } from "@/components/notifications/LineupsNotificationOpener";
import { HighlightNotificationOpener } from "@/components/notifications/HighlightNotificationOpener";
import { QuizActiveNotificationProvider } from "@/components/notifications/QuizActiveNotificationProvider";
import { UnreadNotificationsShell } from "@/components/notifications/UnreadNotificationsShell";
import { PushNotificationProvider } from "@/components/push/PushNotificationProvider";
import { NavigationLoadingProvider } from "@/components/layout/NavigationLoadingProvider";
import { TabBarWrapper } from "@/components/layout/TabBarWrapper";
import { VisualViewportSync } from "@/components/layout/VisualViewportSync";
import { TabNavigationProvider } from "@/components/layout/TabNavigationProvider";
import { TabSwipeNavigator } from "@/components/layout/TabSwipeNavigator";
import { PullToRefresh } from "@/components/layout/PullToRefresh";
import { ViewportLayoutDebug } from "@/components/layout/ViewportLayoutDebug";
import { HighlightScorelineVisibilityProvider } from "@/components/highlights/HighlightScorelineVisibilityProvider";
import { HomeAtmosphere } from "@/components/home/HomeAtmosphere";
import type { AppShellContext } from "@/lib/pool/active-pool";

export function AppShell({
  ctx,
  children,
}: {
  ctx: AppShellContext;
  children: React.ReactNode;
}) {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;

  return (
    <NavigationLoadingProvider>
      <UnreadNotificationsShell>
        <QuizActiveNotificationProvider>
          <PushNotificationProvider vapidPublicKey={vapidPublicKey}>
            <HighlightScorelineVisibilityProvider
              poolId={ctx.activePoolId}
              username={ctx.username}
              initialVisible={ctx.heroHighlightScorelineVisible}
            >
              <LineupsNotificationOpener />
              <HighlightNotificationOpener />
              <PullToRefresh />
              <TabNavigationProvider>
                <VisualViewportSync />
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
                <TabBarWrapper />
                <Suspense fallback={null}>
                  <ViewportLayoutDebug />
                </Suspense>
              </TabNavigationProvider>
            </HighlightScorelineVisibilityProvider>
          </PushNotificationProvider>
        </QuizActiveNotificationProvider>
      </UnreadNotificationsShell>
    </NavigationLoadingProvider>
  );
}
