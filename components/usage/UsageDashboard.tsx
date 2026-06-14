import Link from "next/link";
import { Suspense } from "react";
import { UsageFilters } from "@/components/usage/UsageFilters";
import type { UsageDashboardData } from "@/lib/usage/queries";

function formatDateTimeMadrid(iso: string | null): string {
  if (!iso) return " ";
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function UsageDashboard({ data }: { data: UsageDashboardData }) {
  const userFiltered = Boolean(data.filters.profileId);

  return (
    <div className="space-y-4">
      <Suspense
        fallback={
          <div className="h-10 rounded-lg border border-[var(--tm-border)]/40" aria-hidden />
        }
      >
        <UsageFilters filters={data.filters} users={data.filterUsers} />
      </Suspense>

      <section>
        <h2 className="mb-2 font-display text-[10px] uppercase tracking-[0.2em] text-[var(--tm-muted)]">
          Resumen por usuario
        </h2>
        {data.summaries.length === 0 ? (
          <p className="text-xs text-[var(--tm-muted)]">Sin datos todavia.</p>
        ) : (
          <div className="divide-y divide-[var(--tm-border)]/50">
            {data.summaries.map((user) => (
              <div
                key={user.profileId}
                className="flex min-h-10 items-center gap-2 py-1.5 text-xs"
              >
                <p className="min-w-0 flex-1 truncate font-medium text-[var(--tm-fg)]">
                  {user.displayName}
                  <span className="font-normal text-[var(--tm-muted)]"> @{user.username}</span>
                </p>
                <p className="shrink-0 text-[var(--tm-muted)]">
                  {user.pageViewCount} pag
                </p>
                <p className="shrink-0 text-[var(--tm-muted)]">
                  {user.actionCount} acc
                </p>
                <p className="shrink-0 tabular-nums text-[var(--tm-muted)]">
                  {formatDateTimeMadrid(user.lastSeenAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-display text-[10px] uppercase tracking-[0.2em] text-[var(--tm-muted)]">
          Actividad reciente
        </h2>
        {data.recentEvents.length === 0 ? (
          <p className="text-xs text-[var(--tm-muted)]">Sin eventos recientes.</p>
        ) : (
          <div className="divide-y divide-[var(--tm-border)]/50">
            {data.recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex min-h-9 items-center gap-2 py-1 text-xs"
              >
                {!userFiltered ? (
                  <p className="w-[4.5rem] shrink-0 truncate text-[var(--tm-muted)]">
                    {event.displayName}
                  </p>
                ) : null}
                <p className="min-w-0 flex-1 truncate font-medium text-[var(--tm-fg)]">
                  {event.title}
                </p>
                <p className="w-[6.5rem] shrink-0 text-right tabular-nums text-[var(--tm-muted)]">
                  {event.timeLabel}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link href="/profile" className="inline-block text-xs text-[var(--tm-primary)]">
        Volver al perfil
      </Link>
    </div>
  );
}
