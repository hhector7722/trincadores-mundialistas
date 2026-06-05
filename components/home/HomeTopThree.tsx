import Link from "next/link";
import { formatAggregateStat } from "@/lib/ranking/format";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

export function HomeTopThree({ rows }: { rows: LeaderboardRow[] }) {
  const top = rows.slice(0, 3);
  if (top.length === 0) return null;

  return (
    <div className="tm-glass-card overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-[var(--tm-border)] px-4 py-3">
        <p className="font-display text-sm uppercase tracking-wide text-[var(--tm-fg)]">Ranking</p>
        <Link href="/ranking" className="tm-accent-link text-xs">
          Ver todos
        </Link>
      </div>
      <ul className="divide-y divide-[var(--tm-border)]">
        {top.map((row, i) => (
          <li key={row.profileId}>
            <Link
              href={`/profile/${row.profileId}`}
              className="flex min-h-12 items-center gap-3 px-4 py-3 transition-colors hover:bg-[rgba(111,43,255,0.08)]"
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  i === 0
                    ? "bg-[var(--tm-accent)] text-[var(--tm-primary-fg)]"
                    : "border border-[var(--tm-border)] bg-[rgba(111,43,255,0.1)] text-[var(--tm-muted)]"
                )}
              >
                {formatAggregateStat(row.position)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--tm-fg)]">
                {row.label}
              </span>
              <span className="font-display text-sm text-[var(--tm-accent)]">
                {formatAggregateStat(row.cumulativePoints)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
