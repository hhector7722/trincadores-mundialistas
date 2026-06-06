import { AppBrandTitle } from "@/components/layout/AppBrandTitle";
import { PoolSwitcher } from "@/components/layout/PoolSwitcher";
import { cn } from "@/lib/utils";
import type { AppShellContext } from "@/lib/pool/active-pool";

export function AppHeader({
  ctx,
  stackedTitle = false,
}: {
  ctx: AppShellContext;
  stackedTitle?: boolean;
}) {
  return (
    <header className="relative z-20 shrink-0 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="relative flex items-center justify-center">
        <h1
          className={cn(
            "font-display text-center tracking-wider",
            stackedTitle ? "text-xl sm:text-2xl" : "text-base",
          )}
        >
          <AppBrandTitle stacked={stackedTitle} />
        </h1>
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <PoolSwitcher pools={ctx.pools} activePoolId={ctx.activePoolId} />
        </div>
      </div>
    </header>
  );
}
