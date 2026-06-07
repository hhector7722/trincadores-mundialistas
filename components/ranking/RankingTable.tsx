import { RankingRow } from "@/components/ranking/RankingRow";
import { RANKING_GRID } from "@/components/ranking/ranking-grid";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

export function RankingTable({
  rows,
  currentProfileId,
}: {
  rows: LeaderboardRow[];
  currentProfileId: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--tm-muted)]">
        No hay miembros en esta porra.
      </p>
    );
  }

  return (
    <div className="tm-ranking-table">
      <div
        className={cn(
          RANKING_GRID,
          "tm-ranking-head tm-card-surface sticky top-0 z-10 border-b border-[var(--tm-border)] px-3 text-left font-medium uppercase tracking-wide text-[var(--tm-muted)]"
        )}
      >
        <span aria-hidden="true" />
        <span>Pos</span>
        <span className="col-span-2 text-center">Trincador</span>
        <span>Pts</span>
        <span>Fiab</span>
        <span>Quiz</span>
      </div>
      <div className="tm-ranking-body">
        {rows.map((row) => (
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
