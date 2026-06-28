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
  showSignOutcomeTicks?: boolean;
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
      <span className="col-span-2 flex h-full items-center text-left">Trincador</span>
      {showOutcomes ? (
        <>
          <span aria-hidden="true" className="h-full" />
          <span aria-hidden="true" className="h-full" />
        </>
      ) : null}
      <span className="flex h-full items-center justify-center">
        <TeamHeader team={homeTeam} />
      </span>
      <span className="flex h-full items-center justify-center">
        <TeamHeader team={awayTeam} />
      </span>
      <span className="flex h-full items-center justify-center">Mvp</span>
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
      <span className="flex h-full items-center justify-center">
        <span className="size-5 shrink-0 rounded-full bg-[var(--tm-border)]/35" />
      </span>
      <span className="flex h-full items-center whitespace-nowrap">&nbsp;</span>
      {showOutcomes ? (
        <>
          <span aria-hidden="true" className="h-full" />
          <span aria-hidden="true" className="h-full" />
        </>
      ) : null}
      <span className="h-full" />
      <span className="h-full" />
      <span className="h-full" />
    </div>
  );
}

export function MatchPredictionsBoardTable({
  rows,
  currentProfileId,
  homeTeam,
  awayTeam,
  showOutcomes = false,
  showSignOutcomeTicks = false,
  loading = false,
  isKnockout = false,
}: MatchPredictionsBoardTableProps & { isKnockout?: boolean }) {
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
                  showSignOutcomeTicks={showSignOutcomeTicks}
                  isKnockout={isKnockout}
                />
              );
            })}
      </div>
    </div>
  );
}
