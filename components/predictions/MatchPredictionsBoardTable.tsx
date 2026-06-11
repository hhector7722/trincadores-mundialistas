import { MatchPredictionsBoardRow } from "@/components/predictions/MatchPredictionsBoardRow";
import {
  MATCH_PREDICTIONS_GRID,
  MATCH_PREDICTIONS_SUBGRID_ROW,
} from "@/components/predictions/match-predictions-grid";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import type { MatchPredictionsBoardRow as MatchPredictionsBoardRowType } from "@/lib/predictions/queries";
import { teamAbbr } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

const EMPTY_ROW_COUNT = 11;

type MatchPredictionsBoardTableProps = {
  rows: MatchPredictionsBoardRowType[];
  currentProfileId: string;
  homeTeam: string;
  awayTeam: string;
};

function TeamHeader({ team }: { team: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
      <TeamFlagBadge name={team} size="xxs" loading="eager" />
      <span>{teamAbbr(team)}</span>
    </span>
  );
}

function MatchPredictionsBoardTableHeader({
  homeTeam,
  awayTeam,
}: {
  homeTeam: string;
  awayTeam: string;
}) {
  return (
    <div
      className={cn(
        MATCH_PREDICTIONS_SUBGRID_ROW,
        "shrink-0 border-b border-[var(--tm-border)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--tm-muted)]"
      )}
    >
      <span className="col-span-2 text-left">Trincador</span>
      <span className="text-center">
        <TeamHeader team={homeTeam} />
      </span>
      <span className="text-center">
        <TeamHeader team={awayTeam} />
      </span>
      <span className="text-center">Mvp</span>
    </div>
  );
}

function MatchPredictionsEmptyRow() {
  return (
    <div
      className={cn(
        MATCH_PREDICTIONS_SUBGRID_ROW,
        "tm-ranking-row border-b border-[var(--tm-border)] px-3 last:border-0"
      )}
      aria-hidden="true"
    >
      <span className="flex justify-center">
        <span className="size-9 shrink-0 rounded-full bg-[var(--tm-border)]/35" />
      </span>
      <span className="whitespace-nowrap">&nbsp;</span>
      <span />
      <span />
      <span />
    </div>
  );
}

export function MatchPredictionsBoardTable({
  rows,
  currentProfileId,
  homeTeam,
  awayTeam,
}: MatchPredictionsBoardTableProps) {
  return (
    <div className="tm-match-predictions-board tm-ranking-table">
      <div className="tm-ranking-body overflow-x-auto">
        <div className={cn(MATCH_PREDICTIONS_GRID, "w-max min-w-full")}>
          <MatchPredictionsBoardTableHeader homeTeam={homeTeam} awayTeam={awayTeam} />
          {rows.length === 0
            ? Array.from({ length: EMPTY_ROW_COUNT }, (_, index) => (
                <MatchPredictionsEmptyRow key={`empty-${index}`} />
              ))
            : rows.map((row) => (
                <MatchPredictionsBoardRow
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
