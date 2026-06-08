import { RankingRow } from "@/components/ranking/RankingRow";
import { RANKING_GRID } from "@/components/ranking/ranking-grid";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

const EMPTY_ROW_COUNT = 11;

function RankingEmptyRow() {
  return (
    <div
      className={cn(
        RANKING_GRID,
        "tm-ranking-row w-full border-b border-[var(--tm-border)] px-3 last:border-0"
      )}
      aria-hidden="true"
    >
      <span className="text-[var(--tm-muted)]/20">&nbsp;</span>
      <span className="text-[var(--tm-muted)]/20">&nbsp;</span>
      <span className="text-[var(--tm-muted)]/20">&nbsp;</span>
      <span className="min-w-0 truncate text-[var(--tm-muted)]/20">&nbsp;</span>
      <span className="text-[var(--tm-muted)]/20">&nbsp;</span>
      <span className="text-[var(--tm-muted)]/20">&nbsp;</span>
      <span className="text-[var(--tm-muted)]/20">&nbsp;</span>
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
