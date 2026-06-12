"use client";

import { MatchContextActionsRow } from "@/components/lineup/MatchContextActionsRow";
import { MvpPredictionButton } from "@/components/predictions/MvpPredictionButton";
import { PredictionStatusBadge } from "@/components/predictions/PredictionStatusBadge";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { Button } from "@/components/ui/button";
import { displayGoals, formatListScore } from "@/lib/predictions/edit-state";
import { resolveScoreOutcome } from "@/lib/predictions/prediction-outcome";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import { cn } from "@/lib/utils";

type HomeFinishedMatchPanelProps = {
  match: MatchWithPrediction;
  teamsBlockClassName: string;
  onOpenHomeLineup: () => void;
  onOpenAwayLineup: () => void;
  onOpenPredictionsBoard: () => void;
  onOpenDetail: () => void;
};

/** Marcador oficial centrado entre banderas a la misma altura (slide «Último partido»). */
function HomeFinishedFlagsScoreRow({
  homeTeam,
  awayTeam,
  homeGoals,
  awayGoals,
  groupCode,
}: {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  groupCode?: string | null;
}) {
  return (
    <div className="relative h-[1.625rem] w-full shrink-0">
      <div className="absolute left-[15%] top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
        <TeamFlagBadge name={homeTeam} size="sm" loading="eager" />
      </div>

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[3] -translate-x-1/2 -translate-y-1/2 text-center">
        <span className="block font-display text-[1.15rem] font-semibold tabular-nums leading-none text-white/95 sm:text-xl">
          {displayGoals(homeGoals, awayGoals)}
        </span>
        {groupCode ? (
          <span className="mt-0.5 block text-[7px] font-semibold uppercase leading-none tracking-[0.12em] text-[var(--tm-muted)]">
            {groupCode.toUpperCase()}
          </span>
        ) : null}
      </div>

      <div className="absolute left-[85%] top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
        <TeamFlagBadge name={awayTeam} size="sm" loading="eager" />
      </div>
    </div>
  );
}

function HomeFinishedPredictionSummary({
  predictedHome,
  predictedAway,
  homeGoals,
  awayGoals,
}: {
  predictedHome: number;
  predictedAway: number;
  homeGoals: number;
  awayGoals: number;
}) {
  const outcome = resolveScoreOutcome({
    predictedHome,
    predictedAway,
    resultHome: homeGoals,
    resultAway: awayGoals,
  });
  const predictedText = formatListScore(predictedHome, predictedAway);

  return (
    <div className="relative flex w-full justify-center pl-1">
      <PredictionStatusBadge outcome={outcome} />
      <div className="flex flex-col items-center gap-0 leading-none">
        <p className="text-center text-[6px] font-medium uppercase tracking-wide text-white/40">
          Tu pronóstico
        </p>
        <p className="text-center font-display text-[8px] font-semibold tabular-nums text-[var(--tm-accent)]">
          {predictedText}
        </p>
      </div>
    </div>
  );
}

export function HomeFinishedMatchPanel({
  match,
  teamsBlockClassName,
  onOpenHomeLineup,
  onOpenAwayLineup,
  onOpenPredictionsBoard,
  onOpenDetail,
}: HomeFinishedMatchPanelProps) {
  const homeGoals = match.officialHome;
  const awayGoals = match.officialAway;
  const hasScore = homeGoals != null && awayGoals != null;
  const predictedHome = match.prediction?.home_goals ?? null;
  const predictedAway = match.prediction?.away_goals ?? null;
  const hasPrediction =
    predictedHome != null &&
    predictedAway != null &&
    Number.isInteger(predictedHome) &&
    Number.isInteger(predictedAway);

  return (
    <div className={cn(teamsBlockClassName, "relative overflow-hidden")}>
      <button
        type="button"
        className={cn(
          "absolute inset-x-0 top-0 w-full text-left",
          hasPrediction ? "h-[3rem]" : "h-[1.875rem]",
        )}
        onClick={onOpenDetail}
      >
        {hasScore ? (
          <>
            <HomeFinishedFlagsScoreRow
              homeTeam={match.home_team}
              awayTeam={match.away_team}
              homeGoals={homeGoals}
              awayGoals={awayGoals}
              groupCode={match.group_code}
            />

            {hasPrediction ? (
              <div className="mt-1">
                <HomeFinishedPredictionSummary
                  predictedHome={predictedHome}
                  predictedAway={predictedAway}
                  homeGoals={homeGoals}
                  awayGoals={awayGoals}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </button>

      <div className="absolute inset-x-0 bottom-[1.75rem] h-8">
        <MatchContextActionsRow
          compact
          layout="homeCardStacked"
          homeAnchor="15%"
          awayAnchor="85%"
          lineupActionTone="muted"
          hidePossibleLineups
          className="h-full w-full"
          centerSlot={
            <MvpPredictionButton
              savedPlayerName={match.mvpPrediction?.player_name}
              savedTeamName={match.mvpPrediction?.team_name}
              readOnly
              officialPlayerName={match.officialMvpPlayerName}
              officialTeamName={match.officialMvpTeamName}
              variant="compact"
              className="w-full"
            />
          }
          onOpenHomeLineup={onOpenHomeLineup}
          onOpenAwayLineup={onOpenAwayLineup}
          onOpenPossibleLineups={() => {}}
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <Button
          type="button"
          className="!min-h-0 h-auto w-auto px-3 py-1 text-[10px] leading-none uppercase tracking-[0.12em]"
          onClick={onOpenPredictionsBoard}
        >
          Ver pronósticos
        </Button>
      </div>
    </div>
  );
}
