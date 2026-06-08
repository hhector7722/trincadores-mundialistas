import { RankingRow } from "@/components/ranking/RankingRow";
import { RANKING_GRID } from "@/components/ranking/ranking-grid";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

const EMPTY_ROW_COUNT = 11;

function RankingTableHeader() {
  return (
    <div
      className={cn(
        RANKING_GRID,
        "shrink-0 border-b border-[var(--tm-border)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--tm-muted)]"
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

function RankingEmptyRow() {
  return (
    <div
      className={cn(
        RANKING_GRID,
        "tm-ranking-row w-full border-b border-[var(--tm-border)] px-3 last:border-0"
      )}
      aria-hidden="true"
    >
      <span />
      <span />
      <span className="size-7 shrink-0 rounded-full bg-[var(--tm-border)]/35" />
      <span className="min-w-0 truncate">&nbsp;</span>
      <span />
      <span />
      <span />
    </div>
  );
}

export function RankingTable({
  rows,
  currentProfileId,
}: {
  rows: LeaderboardRow[];
  currentProfileId: string;
}) {
  return (
    <div className="tm-ranking-table">
      <RankingTableHeader />
      <div className="tm-ranking-body">
        {rows.length === 0
          ? Array.from({ length: EMPTY_ROW_COUNT }, (_, index) => (
              <RankingEmptyRow key={`empty-${index}`} />
            ))
          : rows.map((row) => (
              <RankingRow
                key={row.profileId}
                row={row}
                isCurrentUser={row.profileId === currentProfileId}
              />
            ))}
      </div>
    </div>
  );
}
