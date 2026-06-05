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
    <div>
      <div className="flex items-center gap-3 border-b border-[var(--tm-border)] px-4 py-2 text-xs font-medium uppercase tracking-wide text-[var(--tm-muted)]">
        <span className="w-8 shrink-0 text-center">#</span>
        <span className="flex-1">Jugador</span>
        <span className="w-10 shrink-0 text-right">Pts</span>
        <span className="w-8 shrink-0 text-right">8s</span>
        <span className="hidden w-8 shrink-0 text-right sm:block">3s</span>
      </div>
      {rows.map((row) => (
        <RankingRow
          key={row.profileId}
          row={row}
          isCurrentUser={row.profileId === currentProfileId}
        />
      ))}
    </div>
  );
}