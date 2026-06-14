import { Suspense } from "react";
import { AppHeaderGate } from "@/components/layout/AppHeaderGate";
import { AppMainWrapper } from "@/components/layout/AppMainWrapper";
import { LineupsNotificationOpener } from "@/components/notifications/LineupsNotificationOpener";
import { HighlightNotificationOpener } from "@/components/notifications/HighlightNotificationOpener";
import { QuizEntryProvider } from "@/components/quiz/QuizEntryProvider";
import { QuizActiveNotificationProvider } from "@/components/notifications/QuizActiveNotificationProvider";
import type { QuizDayHub } from "@/lib/quiz/types";
import { UnreadNotificationsShell } from "@/components/notifications/UnreadNotificationsShell";
import { PushNotificationProvider } from "@/components/push/PushNotificationProvider";
import { NavigationLoadingProvider } from "@/components/layout/NavigationLoadingProvider";
import { TabBarWrapper } from "@/components/layout/TabBarWrapper";
import { TabNavigationProvider } from "@/components/layout/TabNavigationProvider";
import { TabSwipeNavigator } from "@/components/layout/TabSwipeNavigator";
import { PullToRefresh } from "@/components/layout/PullToRefresh";
import { ViewportLayoutDebug } from "@/components/layout/ViewportLayoutDebug";
import { VisualViewportSync } from "@/components/layout/VisualViewportSync";
import { HighlightScorelineVisibilityProvider } from "@/components/highlights/HighlightScorelineVisibilityProvider";
import { HomeAtmosphere } from "@/components/home/HomeAtmosphere";
import { UsagePageTracker } from "@/components/usage/UsagePageTracker";
import type { AppShellContext } from "@/lib/pool/active-pool";

export function AppShell({
  ctx,
  quizHub,
  children,
}: {
  ctx: AppShellContext;
  quizHub: QuizDayHub;
  children: React.ReactNode;
}) {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;

  return (
    <NavigationLoadingProvider>
      <UnreadNotificationsShell>
        <QuizEntryProvider quizHub={quizHub}>
          <QuizActiveNotificationProvider>
            <PushNotificationProvider vapidPublicKey={vapidPublicKey}>
            <HighlightScorelineVisibilityProvider
              poolId={ctx.activePoolId}
              username={ctx.username}
              initialVisible={ctx.heroHighlightScorelineVisible}
            >
              <LineupsNotificationOpener />
              <HighlightNotificationOpener />
              <TabNavigationProvider>
                <div className="tm-app-shell relative min-h-screen">
                  <div className="tm-app-shell-bg" aria-hidden="true" />
                  <div
                    id="tm-safe-probe"
                    className="pointer-events-none fixed left-0 top-0 -z-50 h-0 w-0 overflow-hidden pb-safe"
                    aria-hidden
                  />
                  <HomeAtmosphere />
                  <AppHeaderGate ctx={ctx} />
                  <AppMainWrapper>
                    <TabSwipeNavigator>{children}</TabSwipeNavigator>
                  </AppMainWrapper>
                </div>
                <PullToRefresh />
                <TabBarWrapper />
                <UsagePageTracker />
                <VisualViewportSync />
                <Suspense fallback={null}>
                  <ViewportLayoutDebug />
                </Suspense>
              </TabNavigationProvider>
            </HighlightScorelineVisibilityProvider>
            </PushNotificationProvider>
          </QuizActiveNotificationProvider>
        </QuizEntryProvider>
      </UnreadNotificationsShell>
    </NavigationLoadingProvider>
  );
}
