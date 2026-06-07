import { AppHeaderGate } from "@/components/layout/AppHeaderGate";
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
    <div className="tm-app-shell relative flex h-dvh flex-col overflow-hidden">
      <HomeAtmosphere />
      <AppHeaderGate ctx={ctx} />
      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-[var(--tm-tabbar-height)]">
        {children}
      </main>
      <TabBar />
    </div>
  );
}
