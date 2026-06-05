import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatAggregateStat } from "@/lib/ranking/format";
import type { LeaderboardRow } from "@/lib/ranking/queries";

export function HomeTopThree({ rows }: { rows: LeaderboardRow[] }) {
  const top = rows.slice(0, 3);
  if (top.length === 0) return null;

  return (
    <Card className="p-0">
      <div className="border-b border-[var(--tm-border)] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--tm-fg)]">Top 3</p>
      </div>
      <ul className="divide-y divide-[var(--tm-border)]">
        {top.map((row) => (
          <li key={row.profileId}>
            <Link
              href={`/profile/${row.profileId}`}
              className="flex min-h-12 items-center gap-3 px-4 py-3"
            >
              <span className="font-display w-6 text-lg text-[var(--tm-fg)]">
                {formatAggregateStat(row.position)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--tm-fg)]">
                {row.label}
              </span>
              <span className="font-display text-sm text-[var(--tm-primary)]">
                {formatAggregateStat(row.cumulativePoints)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-t border-[var(--tm-border)] px-4 py-3">
        <Link href="/ranking" className="text-xs font-medium text-[var(--tm-primary)]">
          Ver ranking
        </Link>
      </div>
    </Card>
  );
}