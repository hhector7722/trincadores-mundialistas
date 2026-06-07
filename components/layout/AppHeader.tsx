import { AppBrandTitle } from "@/components/layout/AppBrandTitle";
import { PoolSwitcher } from "@/components/layout/PoolSwitcher";
import { cn } from "@/lib/utils";
import type { AppShellContext } from "@/lib/pool/active-pool";

export function AppHeader({
  ctx,
  stackedTitle = false,
  title,
  homeFade = false,
}: {
  ctx: AppShellContext;
  stackedTitle?: boolean;
  title?: string;
  homeFade?: boolean;
}) {
  return (
    <header
      className={cn(
        "tm-app-header sticky top-0 z-30 shrink-0 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]",
        homeFade ? "tm-app-header--home" : "tm-app-header--bar",
      )}
    >
      <div className="relative flex items-center justify-center">
        <h1
          className={cn(
            "font-display tracking-wider",
            stackedTitle
              ? "relative left-1/2 w-screen -translate-x-1/2 text-xl sm:text-2xl"
              : "text-center text-base",
          )}
        >
          <AppBrandTitle homeHeader={stackedTitle} title={title} />
        </h1>
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <PoolSwitcher pools={ctx.pools} activePoolId={ctx.activePoolId} />
        </div>
      </div>
    </header>
  );
}
