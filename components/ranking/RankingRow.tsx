import Link from "next/link";
import { PositionTrendIndicator } from "@/components/ranking/PositionTrendIndicator";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { formatAggregateStat } from "@/lib/ranking/format";
import { formatReliabilityPct } from "@/lib/ranking/reliability";
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
        "flex min-h-0 flex-1 items-center gap-2 border-b border-[var(--tm-border)] px-3 last:border-0",
        isCurrentUser && "bg-[var(--tm-highlight)]"
      )}
    >
      <PositionTrendIndicator trend={row.positionTrend} />
      <span className="font-display w-7 shrink-0 text-center text-sm text-[var(--tm-fg)]">
        {formatAggregateStat(row.position)}
      </span>
      <ProfileAvatar avatarUrl={row.avatarUrl} label={row.label} className="h-8 w-8" />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm font-medium",
          isCurrentUser ? "text-[var(--tm-accent)]" : "text-[var(--tm-fg)]"
        )}
      >
        {row.label}
      </span>
      <span
        className={cn(
          "font-display w-10 shrink-0 text-right text-sm",
          isCurrentUser ? "text-[var(--tm-accent)]" : "text-[var(--tm-fg)]"
        )}
      >
        {formatAggregateStat(row.cumulativePoints)}
      </span>
      <span className="w-12 shrink-0 text-right text-xs text-[var(--tm-muted)]">
        {formatReliabilityPct(row.reliabilityPct)}
      </span>
    </Link>
  );
}
