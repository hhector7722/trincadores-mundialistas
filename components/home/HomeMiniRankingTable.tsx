import Link from "next/link";
import type { CSSProperties } from "react";
import { PositionTrendIndicator } from "@/components/ranking/PositionTrendIndicator";
import { MINI_RANKING_GRID } from "@/components/ranking/ranking-grid";
import { formatQuizScore } from "@/lib/quiz/format";
import { formatAggregateStat } from "@/lib/ranking/format";
import { formatReliabilityPct } from "@/lib/ranking/reliability";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

type HomeMiniRankingTableProps = {
  rows: LeaderboardRow[];
  currentProfileId?: string;
};

function MiniRankingHeader() {
  return (
    <div
      className={cn(
        MINI_RANKING_GRID,
        "h-[var(--tm-home-mini-ranking-header-h)] shrink-0 border-b border-white/10 px-[clamp(0.25rem,2cqw,0.375rem)] py-0.5 text-[7px] font-semibold uppercase leading-none tracking-wide text-white/45"
      )}
    >
      <span aria-hidden="true" />
      <span>Pos</span>
      <span className="truncate">Trincador</span>
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
        "tm-home-mini-ranking__row border-b border-white/5 px-[clamp(0.25rem,2cqw,0.375rem)] py-0 text-[8px] leading-none last:border-0"
      )}
    >
      <PositionTrendIndicator trend={row.positionTrend} />
      <span className="shrink-0 font-display tabular-nums text-white/85">
        {formatAggregateStat(row.position)}
      </span>
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
        {formatQuizScore(row.quizPoints, row.hasQuizParticipated)}
      </span>
    </div>
  );
}

export function HomeMiniRankingTable({ rows, currentProfileId }: HomeMiniRankingTableProps) {
  const rowCountStyle =
    rows.length > 0
      ? ({ "--tm-home-mini-ranking-visible-rows": rows.length } as CSSProperties)
      : undefined;

  return (
    <Link
      href="/ranking"
      aria-label="Ver tabla de clasificación"
      style={rowCountStyle}
      className={cn(
        "tm-home-top-stat-card @container flex min-w-0 flex-col overflow-hidden rounded-2xl tm-stat-card",
        "transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00]/50"
      )}
    >
      <MiniRankingHeader />
      <div className="tm-home-mini-ranking__viewport">
        {rows.length === 0 ? (
          <p className="px-3 py-4 text-center text-[8px] text-white/35">Sin clasificación</p>
        ) : (
          rows.map((row) => (
            <MiniRankingDataRow
              key={row.profileId}
              row={row}
              isCurrentUser={row.profileId === currentProfileId}
            />
          ))
        )}
      </div>
    </Link>
  );
}
