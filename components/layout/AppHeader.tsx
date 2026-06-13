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
  pinned = false,
}: {
  ctx: AppShellContext;
  stackedTitle?: boolean;
  title?: string;
  titleClassName?: string;
  showNotificationsBell?: boolean;
  /** Home: cabecera fija al viewport; el spacer reserva el hueco en el flujo. */
  pinned?: boolean;
}) {
  return (
    <>
    <header
      className={cn(
        "tm-app-header relative z-20 shrink-0 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]",
        pinned && "tm-app-header--pinned",
      )}
    >
      <div className="relative flex items-center justify-center">
        <h1
          className={cn(
            "font-display tracking-wider",
            stackedTitle
              ? "relative left-1/2 w-screen -translate-x-1/2 text-xl sm:text-2xl"
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
    {pinned ? <div className="tm-app-header-spacer shrink-0" aria-hidden /> : null}
    </>
  );
}
