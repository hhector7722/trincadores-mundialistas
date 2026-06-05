import { AppBrandTitle } from "@/components/layout/AppBrandTitle";
import { PoolSwitcher } from "@/components/layout/PoolSwitcher";
import type { AppShellContext } from "@/lib/pool/active-pool";

export function AppHeader({ ctx }: { ctx: AppShellContext }) {
  return (
    <header className="shrink-0 bg-[var(--tm-bg)] px-4 pb-2 pt-3">
      <div className="relative flex items-center justify-center">
        <h1 className="font-display text-center text-base tracking-wider">
          <AppBrandTitle />
        </h1>
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <PoolSwitcher pools={ctx.pools} activePoolId={ctx.activePoolId} />
        </div>
      </div>
    </header>
  );
}
