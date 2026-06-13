import { HighlightScorelineToggle } from "@/components/highlights/HighlightScorelineToggle";
import { AppBrandTitle } from "@/components/layout/AppBrandTitle";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import { PoolSwitcher } from "@/components/layout/PoolSwitcher";
import { cn } from "@/lib/utils";
import type { AppShellContext } from "@/lib/pool/active-pool";

export function AppHeader({
  ctx,
  stackedTitle = false,
  title,
  titleClassName,
  showNotificationsBell = false,
  compact = false,
}: {
  ctx: AppShellContext;
  stackedTitle?: boolean;
  title?: string;
  titleClassName?: string;
  showNotificationsBell?: boolean;
  /** Home: cabecera más compacta, siempre en flujo (sin fixed). */
  compact?: boolean;
}) {
  return (
    <header
      className={cn(
        "tm-app-header tm-app-header-fixed fixed top-0 right-0 left-0 z-[100] shrink-0 border-b border-[var(--tm-border)] bg-transparent px-4 backdrop-blur-md",
        compact
          ? "tm-app-header--compact pb-0.5 pt-[max(0.375rem,env(safe-area-inset-top))]"
          : "pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]",
      )}
    >
      <div
        className={cn(
          "tm-app-header__row relative flex items-center justify-center",
          compact && "tm-app-header__row--compact",
        )}
      >
        <h1
          className={cn(
            "font-display tracking-wider",
            stackedTitle
              ? "relative left-1/2 w-screen -translate-x-1/2 text-lg sm:text-xl"
              : "text-center text-base",
            titleClassName,
          )}
        >
          <AppBrandTitle homeHeader={stackedTitle} title={title} />
        </h1>
        <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
          {showNotificationsBell ? (
            <>
              <HighlightScorelineToggle />
              <NotificationsBell />
            </>
          ) : null}
          <PoolSwitcher pools={ctx.pools} activePoolId={ctx.activePoolId} />
        </div>
      </div>
    </header>
  );
}
