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
    <div className="tm-ranking-table">
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
