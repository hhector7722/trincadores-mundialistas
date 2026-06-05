import { RankingRow } from "@/components/ranking/RankingRow";
import type { LeaderboardRow } from "@/lib/ranking/queries";

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
      <div className="flex shrink-0 items-center gap-2 border-b border-[var(--tm-border)] px-3 py-2 text-xs font-medium uppercase leading-none tracking-wide text-[var(--tm-muted)]">
        <span className="w-3 shrink-0" aria-hidden="true" />
        <span className="w-7 shrink-0" aria-hidden="true" />
        <span className="w-8 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1">Trincador</span>
        <span className="w-10 shrink-0 text-right">Pts</span>
        <span className="w-12 shrink-0 text-right">Fiab</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
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
