import Link from "next/link";
import { PositionTrendIndicator } from "@/components/ranking/PositionTrendIndicator";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { formatAggregateStat } from "@/lib/ranking/format";
import { formatReliabilityPct } from "@/lib/ranking/reliability";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

const RANKING_GRID =
  "grid grid-cols-[0.75rem_1.75rem_2rem_minmax(0,1fr)_2.75rem_2.75rem] items-center gap-x-2";

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
        RANKING_GRID,
        "min-h-0 border-b border-[var(--tm-border)] px-3 text-left last:border-0"
      )}
    >
      <PositionTrendIndicator trend={row.positionTrend} />
      <span className="font-display shrink-0 text-sm tabular-nums text-[var(--tm-fg)]">
        {formatAggregateStat(row.position)}
      </span>
      <ProfileAvatar avatarUrl={row.avatarUrl} label={row.label} className="h-8 w-8 shrink-0" />
      <span
        className={cn(
          "min-w-0 truncate text-sm font-medium",
          isCurrentUser ? "text-[var(--tm-accent)]" : "text-[var(--tm-fg)]"
        )}
      >
        {row.label}
      </span>
      <span className="font-display shrink-0 text-sm tabular-nums text-[var(--tm-fg)]">
        {formatAggregateStat(row.cumulativePoints)}
      </span>
      <span className="shrink-0 text-xs tabular-nums text-[var(--tm-muted)]">
        {formatReliabilityPct(row.reliabilityPct)}
      </span>
    </Link>
  );
}
