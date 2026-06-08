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
      <div className="tm-ranking-table flex flex-1 flex-col items-center justify-center px-4">
        <p className="text-center text-sm text-[var(--tm-muted)]">
          Esperando a todos los participantes
        </p>
      </div>
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
