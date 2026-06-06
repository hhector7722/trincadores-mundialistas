import { RankingRow } from "@/components/ranking/RankingRow";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

const RANKING_GRID =
  "grid grid-cols-[0.75rem_1.75rem_2rem_minmax(0,1fr)_2.75rem_2.75rem] items-center gap-x-2";

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
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          RANKING_GRID,
          "shrink-0 border-b border-[var(--tm-border)] px-3 py-2 text-left text-xs font-medium uppercase leading-none tracking-wide text-[var(--tm-muted)]"
        )}
      >
        <span aria-hidden="true" />
        <span>Pos</span>
        <span aria-hidden="true" />
        <span>Trincador</span>
        <span>Pts</span>
        <span>Fiab</span>
      </div>
      <div
        className="grid min-h-0 flex-1"
        style={{ gridTemplateRows: `repeat(${rows.length}, minmax(0, 1fr))` }}
      >
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
