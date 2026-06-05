import { AppHeader } from "@/components/layout/AppHeader";
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
    <div className="relative flex min-h-dvh flex-col">
      <HomeAtmosphere />
      <AppHeader ctx={ctx} />
      <main className="relative z-10 flex-1 overflow-y-auto pb-[var(--tm-tabbar-height)]">{children}</main>
      <TabBar />
    </div>
  );
}
