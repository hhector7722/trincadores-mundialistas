import { signOut } from "@/actions/auth";
import { PoolSwitcher } from "@/components/layout/PoolSwitcher";
import { Button } from "@/components/ui/button";
import type { AppShellContext } from "@/lib/pool/active-pool";

export function AppHeader({ ctx }: { ctx: AppShellContext }) {
  return (
    <header className="shrink-0 border-b border-[var(--tm-border)] bg-[var(--tm-surface)] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--tm-fg)]">{ctx.activePoolName}</p>
          <p className="truncate text-xs text-[var(--tm-muted)]">{ctx.profileLabel}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <PoolSwitcher pools={ctx.pools} activePoolId={ctx.activePoolId} />
          <form action={signOut}>
            <Button type="submit" variant="ghost" className="min-h-10 px-2 text-xs">
              Salir
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
