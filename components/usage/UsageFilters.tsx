import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { todayQuizDate } from "@/lib/quiz/date";
import type { UsageDashboardFilters, UsageFilterUser } from "@/lib/usage/queries";
import { cn } from "@/lib/utils";

function formatDayLabel(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  const label = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, date));
  return label;
}

function buildFilterHref(filters: UsageDashboardFilters): string {
  const params = new URLSearchParams();
  if (filters.day) params.set("dia", filters.day);
  if (filters.profileId) params.set("usuario", filters.profileId);
  const query = params.toString();
  return query ? `/uso?${query}` : "/uso";
}

type UsageFiltersProps = {
  filters: UsageDashboardFilters;
  users: UsageFilterUser[];
};

export function UsageFilters({ filters, users }: UsageFiltersProps) {
  const today = todayQuizDate();
  const selectedUser = users.find((user) => user.profileId === filters.profileId);

  return (
    <Card className="p-4">
      <h2 className="font-display text-sm uppercase tracking-wide text-[var(--tm-fg)]">
        Filtros
      </h2>
      <form action="/uso" method="get" className="mt-3 space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="usage-day" className="text-xs uppercase tracking-wide text-[var(--tm-muted)]">
            Dia
          </label>
          <Input
            id="usage-day"
            name="dia"
            type="date"
            defaultValue={filters.day ?? ""}
            className="min-h-12"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="usage-user"
            className="text-xs uppercase tracking-wide text-[var(--tm-muted)]"
          >
            Usuario
          </label>
          <select
            id="usage-user"
            name="usuario"
            defaultValue={filters.profileId ?? ""}
            className={cn(
              "min-h-12 w-full rounded-xl border border-[var(--tm-border)] bg-[var(--tm-surface)] px-3 text-base text-[var(--tm-fg)] outline-none",
              "focus:border-[var(--tm-accent-muted)]"
            )}
          >
            <option value="">Todos los usuarios</option>
            {users.map((user) => (
              <option key={user.profileId} value={user.profileId}>
                {user.displayName} (@{user.username})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" className="min-h-12 shrink-0">
            Aplicar
          </Button>
          <Link
            href="/uso"
            className={cn(
              "inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl border border-[var(--tm-border)] px-4 text-sm font-medium text-[var(--tm-fg)]",
              "hover:border-[var(--tm-primary)]/50 hover:text-[var(--tm-primary)]"
            )}
          >
            Limpiar
          </Link>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Link
          href={buildFilterHref({ ...filters, day: today })}
          className={cn(
            "rounded-full border px-2.5 py-1",
            filters.day === today
              ? "border-[var(--tm-primary)] text-[var(--tm-primary)]"
              : "border-[var(--tm-border)] text-[var(--tm-muted)]"
          )}
        >
          Hoy
        </Link>
        <Link
          href={buildFilterHref({ ...filters, day: null })}
          className={cn(
            "rounded-full border px-2.5 py-1",
            !filters.day
              ? "border-[var(--tm-primary)] text-[var(--tm-primary)]"
              : "border-[var(--tm-border)] text-[var(--tm-muted)]"
          )}
        >
          Todos los dias
        </Link>
      </div>

      {(filters.day || selectedUser) && (
        <p className="mt-3 text-xs text-[var(--tm-muted)]">
          Mostrando
          {filters.day ? ` el ${formatDayLabel(filters.day)}` : " todos los dias"}
          {selectedUser ? ` · ${selectedUser.displayName}` : ""}
        </p>
      )}
    </Card>
  );
}
