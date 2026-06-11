import { GeneralPredictionsRow } from "@/components/tournament-predictions/GeneralPredictionsRow";
import {
  GENERAL_PREDICTIONS_GRID,
  GENERAL_PREDICTIONS_SUBGRID_ROW,
} from "@/components/tournament-predictions/general-predictions-grid";
import type { TournamentGeneralPredictionsBoardRow } from "@/lib/tournament-predictions/types";
import { cn } from "@/lib/utils";

const EMPTY_ROW_COUNT = 11;

function GeneralPredictionsTableHeader() {
  return (
    <div
      className={cn(
        GENERAL_PREDICTIONS_SUBGRID_ROW,
        "shrink-0 border-b border-[var(--tm-border)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--tm-muted)]"
      )}
    >
      <span className="text-left">Trincador</span>
      <span className="text-center">Cam</span>
      <span className="text-center">Fin</span>
      <span className="text-center">Gol</span>
      <span className="text-center">Mvp</span>
      <span className="text-center">Por</span>
    </div>
  );
}

function GeneralPredictionsEmptyRow() {
  return (
    <div
      className={cn(
        GENERAL_PREDICTIONS_SUBGRID_ROW,
        "tm-ranking-row border-b border-[var(--tm-border)] px-3 last:border-0"
      )}
      aria-hidden="true"
    >
      <div className="flex w-max items-center gap-2.5">
        <span className="size-9 shrink-0 rounded-full bg-[var(--tm-border)]/35" />
        <span className="whitespace-nowrap">&nbsp;</span>
      </div>
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export function GeneralPredictionsTable({
  rows,
  currentProfileId,
}: {
  rows: TournamentGeneralPredictionsBoardRow[];
  currentProfileId: string;
}) {
  return (
    <div className="tm-ranking-table">
      <div className="tm-ranking-body overflow-x-auto">
        <div className={cn(GENERAL_PREDICTIONS_GRID, "w-max min-w-full")}>
          <GeneralPredictionsTableHeader />
          {rows.length === 0
            ? Array.from({ length: EMPTY_ROW_COUNT }, (_, index) => (
                <GeneralPredictionsEmptyRow key={`empty-${index}`} />
              ))
            : rows.map((row) => (
                <GeneralPredictionsRow
                  key={row.profileId}
                  row={row}
                  isCurrentUser={row.profileId === currentProfileId}
                />
              ))}
        </div>
      </div>
    </div>
  );
}
