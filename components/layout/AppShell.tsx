import { AppHeaderGate } from "@/components/layout/AppHeaderGate";
import { NavigationLoadingProvider } from "@/components/layout/NavigationLoadingProvider";
import { TabBar } from "@/components/layout/TabBar";
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
      <div className="relative flex min-h-dvh flex-col">
        <HomeAtmosphere />
        <AppHeaderGate ctx={ctx} />
        <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto pb-[var(--tm-tabbar-height)]">
          {children}
        </main>
        <TabBar />
      </div>
    </NavigationLoadingProvider>
  );
}
