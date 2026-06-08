import Link from "next/link";
import { formatAggregateStat } from "@/lib/ranking/format";
import { formatReliabilityPct } from "@/lib/ranking/reliability";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

const EMPTY_ROW_COUNT = 3;
const MINI_RANKING_GRID = "grid grid-cols-[minmax(0,1fr)_2.25rem_2.25rem] items-center gap-x-2";

type HomeMiniRankingTableProps = {
  rows: LeaderboardRow[];
  currentProfileId?: string;
};

function MiniRankingHeader() {
  return (
    <div
      className={cn(
        MINI_RANKING_GRID,
        "border-b border-white/10 px-[clamp(0.5rem,3cqw,0.75rem)] py-1.5 text-[9px] font-semibold uppercase tracking-wide text-white/45"
      )}
    >
      <span>Trincador</span>
      <span className="text-right">Pts</span>
      <span className="text-right">Fiab</span>
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
    <Link
      href={`/profile/${row.profileId}`}
      className={cn(
        MINI_RANKING_GRID,
        "min-h-8 border-b border-white/5 px-[clamp(0.5rem,3cqw,0.75rem)] py-1.5 text-[clamp(10px,2.8cqw,12px)] transition-colors last:border-0 hover:bg-white/5"
      )}
    >
      <span
        className={cn(
          "min-w-0 truncate font-medium",
          isCurrentUser ? "text-[#CCFF00]" : "text-white/85"
        )}
      >
        {row.label}
      </span>
      <span className="text-right font-display tabular-nums text-white/85">
        {formatAggregateStat(row.cumulativePoints)}
      </span>
      <span className="text-right text-[10px] tabular-nums text-white/45">
        {formatReliabilityPct(row.reliabilityPct)}
      </span>
    </Link>
  );
}

function MiniRankingEmptyRow() {
  return (
    <div
      className={cn(
        MINI_RANKING_GRID,
        "min-h-8 border-b border-white/5 px-[clamp(0.5rem,3cqw,0.75rem)] py-1.5 text-[clamp(10px,2.8cqw,12px)] last:border-0"
      )}
      aria-hidden="true"
    >
      <span className="min-w-0 truncate text-white/20">&nbsp;</span>
      <span className="text-right text-white/20">&nbsp;</span>
      <span className="text-right text-white/20">&nbsp;</span>
    </div>
  );
}

export function HomeMiniRankingTable({ rows, currentProfileId }: HomeMiniRankingTableProps) {
  const displayRows = rows.slice(0, EMPTY_ROW_COUNT);
  const emptyRowCount = Math.max(0, EMPTY_ROW_COUNT - displayRows.length);

  return (
    <div className="@container min-w-0 overflow-hidden rounded-2xl tm-stat-card">
      <div className="flex shrink-0 items-center justify-between gap-2 px-[clamp(0.5rem,3cqw,0.75rem)] py-1">
        <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-[#CCFF00]">
          Clasificación
        </p>
        <Link
          href="/ranking"
          className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-[#CCFF00]/80 hover:text-[#CCFF00]"
        >
          Ver todos
        </Link>
      </div>
      <MiniRankingHeader />
      <div>
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
  );
}
