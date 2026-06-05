import Link from "next/link";
import { formatAggregateStat } from "@/lib/ranking/format";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

export function RankingRow({
  row,
  isCurrentUser,
}: {
  row: LeaderboardRow;
  isCurrentUser: boolean;
}) {
  return (
    <Link
      href={`/profile/${row.profileId}`}
      className={cn(
        "flex min-h-12 items-center gap-3 border-b border-[var(--tm-border)] px-4 py-3 last:border-0",
        isCurrentUser && "bg-[var(--tm-primary-soft)]"
      )}
    >
      <span className="font-display w-8 shrink-0 text-center text-lg text-[var(--tm-fg)]">
        {formatAggregateStat(row.position)}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--tm-fg)]">
        {row.label}
      </span>
      <span className="font-display w-10 shrink-0 text-right text-base text-[var(--tm-primary)]">
        {formatAggregateStat(row.cumulativePoints)}
      </span>
      <span className="w-8 shrink-0 text-right text-xs text-[var(--tm-muted)]">
        {formatAggregateStat(row.exactHits)}
      </span>
      <span className="hidden w-8 shrink-0 text-right text-xs text-[var(--tm-subtle)] sm:block">
        {formatAggregateStat(row.signHits)}
      </span>
    </Link>
  );
}