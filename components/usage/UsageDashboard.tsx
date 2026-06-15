import Link from "next/link";
import { Suspense } from "react";
import { UsageFilters } from "@/components/usage/UsageFilters";
import { UsageRecentActivity } from "@/components/usage/UsageRecentActivity";
import { UsageUserSummarySection } from "@/components/usage/UsageUserSummarySection";
import type { UsageDashboardData, UsageDashboardFilters } from "@/lib/usage/queries";

function buildActivityFilterQuery(filters: UsageDashboardFilters): {
  dia?: string;
  usuarios?: string;
} {
  const query: { dia?: string; usuarios?: string } = {};
  if (filters.day) query.dia = filters.day;
  if (filters.profileIds === null) return query;
  if (filters.profileIds.length === 0) query.usuarios = "ninguno";
  else query.usuarios = filters.profileIds.join(",");
  return query;
}

function buildActivityFilterKey(filters: UsageDashboardFilters): string {
  const query = buildActivityFilterQuery(filters);
  return `${query.dia ?? "all"}:${query.usuarios ?? "all"}`;
}

type UsageDashboardProps = {
  data: UsageDashboardData;
  poolId: string;
};

export function UsageDashboard({ data, poolId }: UsageDashboardProps) {
  const filterQuery = buildActivityFilterQuery(data.filters);
  const activityKey = buildActivityFilterKey(data.filters);

  return (
    <div className="space-y-4">
      <Suspense
        fallback={
          <div className="h-10 rounded-lg border border-[var(--tm-border)]/40" aria-hidden />
        }
      >
        <UsageFilters filters={data.filters} users={data.filterUsers} />
      </Suspense>

      <UsageUserSummarySection summaries={data.summaries} />

      <section>
        <h2 className="mb-2 font-display text-[10px] uppercase tracking-[0.2em] text-[var(--tm-muted)]">
          Actividad reciente
        </h2>
        <UsageRecentActivity
          key={activityKey}
          poolId={poolId}
          initialEvents={data.recentEvents}
          initialHasMore={data.recentEventsHasMore}
          filterQuery={filterQuery}
        />
      </section>

      <Link href="/profile" className="inline-block text-xs text-[var(--tm-primary)]">
        Volver al perfil
      </Link>
    </div>
  );
}
