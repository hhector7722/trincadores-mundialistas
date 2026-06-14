import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { UsageFilters } from "@/components/usage/UsageFilters";
import { formatDurationMs } from "@/lib/usage/labels";
import type { AppUsageEventType } from "@/lib/usage/types";
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

function eventTypeLabel(type: AppUsageEventType): string {
  if (type === "login") return "Login";
  if (type === "session") return "Sesion";
  if (type === "action") return "Accion";
  return "Pagina";
}

const maxHourCount = (buckets: UsageDashboardData["hourlyBuckets"]) =>
  Math.max(1, ...buckets.map((b) => b.count));

export function UsageDashboard({ data }: { data: UsageDashboardData }) {
  const hourPeak = maxHourCount(data.hourlyBuckets);
  const scopeLabel = data.filters.day ? "en el dia seleccionado" : "en el periodo";

  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="min-h-40 rounded-xl border border-[var(--tm-border)] bg-[var(--tm-surface)] p-4" aria-hidden />}>
        <UsageFilters filters={data.filters} users={data.filterUsers} />
      </Suspense>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--tm-muted)]">Usuarios activos</p>
          <p className="mt-1 font-display text-2xl text-[var(--tm-fg)]">{data.totals.activeUsers}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--tm-muted)]">Eventos</p>
          <p className="mt-1 font-display text-2xl text-[var(--tm-fg)]">{data.totals.eventsCount}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--tm-muted)]">Sesiones</p>
          <p className="mt-1 font-display text-2xl text-[var(--tm-fg)]">{data.totals.sessionsCount}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--tm-muted)]">Acciones</p>
          <p className="mt-1 font-display text-2xl text-[var(--tm-fg)]">{data.totals.actionsCount}</p>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="font-display text-sm uppercase tracking-wide text-[var(--tm-fg)]">
          Actividad por hora (Madrid)
        </h2>
        <p className="mt-1 text-xs text-[var(--tm-muted)]">{scopeLabel}</p>
        <div className="mt-4 flex h-28 items-end gap-1">
          {data.hourlyBuckets.map((bucket) => {
            const height = Math.round((bucket.count / hourPeak) * 100);
            return (
              <div key={bucket.hour} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-[var(--tm-primary)]/80"
                  style={{ height: `${Math.max(height, bucket.count > 0 ? 8 : 2)}%` }}
                  title={`${bucket.hour}:00 — ${bucket.count} eventos`}
                />
                <span className="text-[9px] text-[var(--tm-muted)]">
                  {bucket.hour % 3 === 0 ? `${bucket.hour}h` : " "}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-[var(--tm-border)] px-4 py-3">
          <h2 className="font-display text-sm uppercase tracking-wide text-[var(--tm-fg)]">
            Resumen por usuario
          </h2>
        </div>
        {data.summaries.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[var(--tm-muted)]">
            Aun no hay datos. Se registraran logins y sesiones a partir de ahora.
          </p>
        ) : (
          <div className="divide-y divide-[var(--tm-border)]">
            {data.summaries.map((user) => (
              <div key={user.profileId} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--tm-fg)]">{user.displayName}</p>
                    <p className="text-xs text-[var(--tm-muted)]">@{user.username}</p>
                  </div>
                  <div className="text-right text-xs text-[var(--tm-muted)]">
                    <p>Ultima: {formatDateTimeMadrid(user.lastSeenAt)}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-[var(--tm-border)] px-2 py-0.5">
                    {user.loginCount} logins
                  </span>
                  <span className="rounded-full border border-[var(--tm-border)] px-2 py-0.5">
                    {user.sessionCount} sesiones
                  </span>
                  <span className="rounded-full border border-[var(--tm-border)] px-2 py-0.5">
                    {user.pageViewCount} paginas
                  </span>
                  <span className="rounded-full border border-[var(--tm-border)] px-2 py-0.5">
                    {user.actionCount} acciones
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-[var(--tm-border)] px-4 py-3">
          <h2 className="font-display text-sm uppercase tracking-wide text-[var(--tm-fg)]">
            Actividad reciente
          </h2>
        </div>
        {data.recentEvents.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[var(--tm-muted)]">Sin eventos recientes.</p>
        ) : (
          <div className="divide-y divide-[var(--tm-border)]">
            {data.recentEvents.map((event) => (
              <div key={event.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--tm-fg)]">{event.label}</p>
                  <p className="truncate text-xs text-[var(--tm-muted)]">
                    {event.displayName} · {eventTypeLabel(event.eventType)}
                  </p>
                  {event.detail.trim() ? (
                    <p className="truncate text-[11px] text-[var(--tm-muted)]/80">{event.detail}</p>
                  ) : null}
                  {event.durationMs != null && event.durationMs > 0 ? (
                    <p className="text-[11px] text-[var(--tm-primary)]">
                      {formatDurationMs(event.durationMs)}
                    </p>
                  ) : null}
                </div>
                <p className="shrink-0 text-xs tabular-nums text-[var(--tm-muted)]">
                  {event.timeLabel}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Link href="/profile" className="inline-block text-sm text-[var(--tm-primary)]">
        Volver al perfil
      </Link>
    </div>
  );
}
