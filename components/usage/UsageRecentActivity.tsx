"use client";

import { Fragment, useState, useTransition } from "react";
import { fetchMoreUsageActivityAction } from "@/actions/usage";
import { Button } from "@/components/ui/button";
import type { UsageRecentEvent } from "@/lib/usage/queries";
import { cn } from "@/lib/utils";

type UsageRecentActivityProps = {
  poolId: string;
  initialEvents: UsageRecentEvent[];
  initialHasMore: boolean;
  filterQuery: {
    dia?: string;
    usuarios?: string;
  };
};

export function UsageRecentActivity({
  poolId,
  initialEvents,
  initialHasMore,
  filterQuery,
}: UsageRecentActivityProps) {
  const [events, setEvents] = useState(initialEvents);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function loadMore() {
    startTransition(async () => {
      setError(null);
      const result = await fetchMoreUsageActivityAction({
        poolId,
        offset: events.length,
        dia: filterQuery.dia,
        usuarios: filterQuery.usuarios,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setEvents((current) => [...current, ...result.events]);
      setHasMore(result.hasMore);
    });
  }

  if (events.length === 0) {
    return <p className="text-xs text-[var(--tm-muted)]">Sin eventos recientes.</p>;
  }

  return (
    <div className="space-y-0">
      <div>
        {events.map((event, index) => {
          const previous = index > 0 ? events[index - 1] : null;
          const isNewUser = !previous || previous.profileId !== event.profileId;

          return (
            <Fragment key={event.id}>
              {isNewUser ? (
                <div
                  className={cn(
                    "rounded-lg bg-[var(--tm-accent)] px-2.5 py-1.5",
                    index > 0 && "mt-2"
                  )}
                >
                  <p className="truncate text-xs font-semibold text-[var(--tm-primary-fg)]">
                    {event.displayName}
                  </p>
                </div>
              ) : null}

              <div className="flex min-h-9 items-center gap-2 py-1 text-xs">
                <p className="min-w-0 flex-1 truncate font-medium text-[var(--tm-fg)]">
                  {event.title}
                </p>
                <p className="w-[6.5rem] shrink-0 text-right tabular-nums text-[var(--tm-muted)]">
                  {event.timeLabel}
                </p>
              </div>
            </Fragment>
          );
        })}
      </div>

      {error ? <p className="pt-2 text-xs text-red-400">{error}</p> : null}

      {hasMore ? (
        <div className="flex justify-center pt-3">
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 text-xs"
            onClick={loadMore}
            disabled={pending}
          >
            {pending ? "Cargando…" : "Ver mas"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
