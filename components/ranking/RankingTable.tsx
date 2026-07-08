import { RankingRow } from "@/components/ranking/RankingRow";
import { RANKING_GRID } from "@/components/ranking/ranking-grid";
import { MATCH_SCORE_POINTS, MVP_PREDICTION_POINTS } from "@/lib/predictions/scoring";
import { QuizBonusToggle } from "@/components/ranking/QuizBonusToggle";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

const EMPTY_ROW_COUNT = 11;

function RankingTableHeader() {
  return (
    <div
      className={cn(
        RANKING_GRID,
        "shrink-0 border-b border-[var(--tm-border)] px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--tm-muted)]"
      )}
    >
      <span aria-hidden="true" />
      <span className="text-left">Pos</span>
      <span className="text-left">Trincador</span>
      <span className="text-center" title="Puntos totales">Pts</span>
      <span className="text-center" title={`Signo acertado en fase de grupos (${MATCH_SCORE_POINTS.sign} pts)`}>✅</span>
      <span className="text-center" title={`Clasificado correcto en eliminatorias (${MATCH_SCORE_POINTS.sign} pts)`}>✅✅</span>
      <span className="text-center" title={`Marcador exacto (${MATCH_SCORE_POINTS.exact} pts)`}>✅✅✅</span>
      <span className="text-center" title={`MVP acertado (${MVP_PREDICTION_POINTS} pt)`}>⭐</span>
      <div className="flex items-center justify-center">
        <QuizBonusToggle />
      </div>
    </div>
  );
}

function RankingEmptyRow() {
  return (
    <div
      className={cn(
        RANKING_GRID,
        "tm-ranking-row w-full border-b border-[var(--tm-border)] px-2 last:border-0"
      )}
      aria-hidden="true"
    >
      <span />
      <span />
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="size-9 shrink-0 rounded-full bg-[var(--tm-border)]/35" />
        <span className="min-w-0 flex-1 truncate">&nbsp;</span>
      </div>
      <span />
      <span />
      <span />
      <span />
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
