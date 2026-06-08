import Link from "next/link";
import { PositionTrendIndicator } from "@/components/ranking/PositionTrendIndicator";
import { RANKING_GRID } from "@/components/ranking/ranking-grid";
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
        RANKING_GRID,
        "tm-ranking-row w-full border-b border-[var(--tm-border)] px-3 text-left last:border-0"
      )}
    >
      <PositionTrendIndicator trend={row.positionTrend} />
      <span className="font-display shrink-0 text-xs tabular-nums text-[var(--tm-fg)]">
        {formatAggregateStat(row.position)}
      </span>
      <ProfileAvatar avatarUrl={row.avatarUrl} label={row.label} className="size-7 shrink-0" />
      <span
        className={cn(
          "min-w-0 truncate text-xs font-medium",
          isCurrentUser ? "text-[var(--tm-accent)]" : "text-[var(--tm-fg)]"
        )}
      >
        {row.label}
      </span>
      <span className="font-display shrink-0 text-xs tabular-nums text-[var(--tm-fg)]">
        {formatAggregateStat(row.cumulativePoints)}
      </span>
      <span className="shrink-0 text-[10px] tabular-nums text-[var(--tm-muted)]">
        {formatReliabilityPct(row.reliabilityPct)}
      </span>
      <span className="font-display shrink-0 text-xs tabular-nums text-[var(--tm-fg)]">
        {formatAggregateStat(row.quizPoints)}
      </span>
    </Link>
  );
}
