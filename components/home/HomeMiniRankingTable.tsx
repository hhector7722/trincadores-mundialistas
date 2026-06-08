import Link from "next/link";
import { PositionTrendIndicator } from "@/components/ranking/PositionTrendIndicator";
import { MINI_RANKING_GRID } from "@/components/ranking/ranking-grid";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { formatAggregateStat } from "@/lib/ranking/format";
import { formatReliabilityPct } from "@/lib/ranking/reliability";
import { pickContextualLeaderboardRows } from "@/lib/ranking/context-rows";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

const EMPTY_ROW_COUNT = 3;

type HomeMiniRankingTableProps = {
  rows: LeaderboardRow[];
  currentProfileId?: string;
};

function MiniRankingHeader() {
  return (
    <div
      className={cn(
        MINI_RANKING_GRID,
        "shrink-0 border-b border-white/10 px-[clamp(0.375rem,2.5cqw,0.5rem)] py-1 text-[8px] font-semibold uppercase tracking-wide text-white/45"
      )}
    >
      <span aria-hidden="true" />
      <span>Pos</span>
      <span aria-hidden="true" />
      <span>Trincador</span>
      <span className="text-right">Pts</span>
      <span className="text-right">Fiab</span>
      <span className="text-right">Quiz</span>
    </div>
  );
}

function MiniRankingDataRow({
  row,
  isCurrentUser,
}: {
  row: LeaderboardRow;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className={cn(
        MINI_RANKING_GRID,
        "flex min-h-0 flex-1 border-b border-white/5 px-[clamp(0.375rem,2.5cqw,0.5rem)] py-1 text-[9px] last:border-0"
      )}
    >
      <PositionTrendIndicator trend={row.positionTrend} />
      <span className="shrink-0 font-display tabular-nums text-white/85">
        {formatAggregateStat(row.position)}
      </span>
      <ProfileAvatar
        avatarUrl={row.avatarUrl}
        label={row.label}
        className="size-[1.125rem] shrink-0"
      />
      <span
        className={cn(
          "min-w-0 truncate font-medium",
          isCurrentUser ? "text-[#CCFF00]" : "text-white/85"
        )}
      >
        {row.label}
      </span>
      <span className="shrink-0 text-right font-display tabular-nums text-white/85">
        {formatAggregateStat(row.cumulativePoints)}
      </span>
      <span className="shrink-0 text-right tabular-nums text-white/45">
        {formatReliabilityPct(row.reliabilityPct)}
      </span>
      <span className="shrink-0 text-right font-display tabular-nums text-white/85">
        {formatAggregateStat(row.quizPoints)}
      </span>
    </div>
  );
}

function MiniRankingEmptyRow() {
  return (
    <div
      className={cn(
        MINI_RANKING_GRID,
        "flex min-h-0 flex-1 border-b border-white/5 px-[clamp(0.375rem,2.5cqw,0.5rem)] py-1 text-[9px] last:border-0"
      )}
      aria-hidden="true"
    >
      <span />
      <span />
      <span className="size-[1.125rem] shrink-0 rounded-full bg-white/10" />
      <span className="min-w-0 truncate text-white/20">&nbsp;</span>
      <span />
      <span />
      <span />
    </div>
  );
}

export function HomeMiniRankingTable({ rows, currentProfileId }: HomeMiniRankingTableProps) {
  const displayRows = pickContextualLeaderboardRows(rows, currentProfileId);
  const emptyRowCount = Math.max(0, EMPTY_ROW_COUNT - displayRows.length);

  return (
    <Link
      href="/ranking"
      aria-label="Ver tabla de clasificación"
      className={cn(
        "tm-home-top-stat-card @container flex min-w-0 flex-col overflow-hidden rounded-2xl tm-stat-card",
        "transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00]/50"
      )}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-h-full min-w-max flex-1 flex-col">
          <MiniRankingHeader />
          <div className="flex min-h-0 flex-1 flex-col">
            {displayRows.map((row) => (
              <MiniRankingDataRow
                key={row.profileId}
                row={row}
                isCurrentUser={row.profileId === currentProfileId}
              />
            ))}
            {Array.from({ length: emptyRowCount }, (_, index) => (
              <MiniRankingEmptyRow key={`empty-${index}`} />
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
