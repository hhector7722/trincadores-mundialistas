"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { UsageUserSummary } from "@/lib/usage/queries";
import { cn } from "@/lib/utils";

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

type UsageUserSummarySectionProps = {
  summaries: UsageUserSummary[];
};

export function UsageUserSummarySection({ summaries }: UsageUserSummarySectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex min-h-10 w-full items-center justify-between gap-2 text-left"
        aria-expanded={expanded}
      >
        <h2 className="font-display text-[10px] uppercase tracking-[0.2em] text-[var(--tm-muted)]">
          Resumen por usuario
          {summaries.length > 0 ? (
            <span className="ml-1.5 normal-case tracking-normal text-[var(--tm-subtle)]">
              ({summaries.length})
            </span>
          ) : null}
        </h2>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[var(--tm-muted)] transition-transform",
            expanded && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {expanded ? (
        summaries.length === 0 ? (
          <p className="text-xs text-[var(--tm-muted)]">Sin datos todavia.</p>
        ) : (
          <div className="divide-y divide-[var(--tm-border)]/50">
            {summaries.map((user) => (
              <div
                key={user.profileId}
                className="flex min-h-10 items-center gap-2 py-1.5 text-xs"
              >
                <p className="min-w-0 flex-1 truncate font-medium text-[var(--tm-fg)]">
                  {user.displayName}
                  <span className="font-normal text-[var(--tm-muted)]"> @{user.username}</span>
                </p>
                <p className="shrink-0 text-[var(--tm-muted)]">{user.pageViewCount} pag</p>
                <p className="shrink-0 text-[var(--tm-muted)]">{user.actionCount} acc</p>
                <p className="shrink-0 tabular-nums text-[var(--tm-muted)]">
                  {formatDateTimeMadrid(user.lastSeenAt)}
                </p>
              </div>
            ))}
          </div>
        )
      ) : null}
    </section>
  );
}
