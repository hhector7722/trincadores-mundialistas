import { MatchPredictionsBoardRow } from "@/components/predictions/MatchPredictionsBoardRow";
import {
  MATCH_PREDICTIONS_ROW_COUNT,
  matchPredictionsGrid,
  matchPredictionsSubgridRow,
} from "@/components/predictions/match-predictions-grid";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import type { MatchPredictionsBoardRow as MatchPredictionsBoardRowType } from "@/lib/predictions/queries";
import { teamAbbr } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type MatchPredictionsBoardTableProps = {
  rows: MatchPredictionsBoardRowType[];
  currentProfileId: string;
  homeTeam: string;
  awayTeam: string;
  showOutcomes?: boolean;
  loading?: boolean;
};

function TeamHeader({ team }: { team: string }) {
  return (
    <span className="inline-flex w-full items-center justify-center gap-1 whitespace-nowrap">
      <TeamFlagBadge name={team} size="xxs" loading="eager" />
      <span>{teamAbbr(team)}</span>
    </span>
  );
}

function MatchPredictionsBoardTableHeader({
  homeTeam,
  awayTeam,
  showOutcomes,
}: {
  homeTeam: string;
  awayTeam: string;
  showOutcomes: boolean;
}) {
  return (
    <div
      className={cn(
        matchPredictionsSubgridRow(showOutcomes),
        "shrink-0 border-b border-[var(--tm-border)] py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--tm-muted)]"
      )}
    >
      <span className="col-span-2 text-left">Trincador</span>
      {showOutcomes ? <span aria-hidden="true" /> : null}
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

function MatchPredictionsEmptyRow({ showOutcomes }: { showOutcomes: boolean }) {
  return (
    <div
      className={cn(
        matchPredictionsSubgridRow(showOutcomes),
        "tm-ranking-row border-b border-[var(--tm-border)] last:border-0"
      )}
      aria-hidden="true"
    >
      <span className="flex justify-center">
        <span className="size-6 shrink-0 rounded-full bg-[var(--tm-border)]/35" />
      </span>
      <span className="whitespace-nowrap">&nbsp;</span>
      {showOutcomes ? <span aria-hidden="true" /> : null}
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
  showOutcomes = false,
  loading = false,
}: MatchPredictionsBoardTableProps) {
  const dataRows = loading ? [] : rows;
  const slotCount = loading
    ? MATCH_PREDICTIONS_ROW_COUNT
    : showOutcomes
      ? dataRows.length
      : Math.max(dataRows.length, MATCH_PREDICTIONS_ROW_COUNT);

  return (
    <div className="tm-match-predictions-board">
      <div className={cn(matchPredictionsGrid(showOutcomes), "tm-match-predictions-board__grid")}>
        <MatchPredictionsBoardTableHeader
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          showOutcomes={showOutcomes}
        />
        {loading
          ? Array.from({ length: MATCH_PREDICTIONS_ROW_COUNT }, (_, index) => (
              <MatchPredictionsEmptyRow key={`loading-${index}`} showOutcomes={showOutcomes} />
            ))
          : Array.from({ length: slotCount }, (_, index) => {
              const row = dataRows[index];
              if (!row) {
                return <MatchPredictionsEmptyRow key={`pad-${index}`} showOutcomes={showOutcomes} />;
              }
              return (
                <MatchPredictionsBoardRow
                  key={row.profileId}
                  row={row}
                  isCurrentUser={row.profileId === currentProfileId}
                  showOutcomes={showOutcomes}
                />
              );
            })}
      </div>
    </div>
  );
}
