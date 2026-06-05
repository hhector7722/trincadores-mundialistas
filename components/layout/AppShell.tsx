import { AppHeader } from "@/components/layout/AppHeader";
import { TabBar } from "@/components/layout/TabBar";
import type { AppShellContext } from "@/lib/pool/active-pool";

export function AppShell({
  ctx,
  children,
}: {
  ctx: AppShellContext;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--tm-bg)]">
      <AppHeader ctx={ctx} />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <TabBar />
    </div>
  );
}
