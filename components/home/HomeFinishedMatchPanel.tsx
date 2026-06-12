"use client";

import { MatchContextActionsRow } from "@/components/lineup/MatchContextActionsRow";
import { MvpPredictionButton } from "@/components/predictions/MvpPredictionButton";
import { PredictionStatusBadge } from "@/components/predictions/PredictionStatusBadge";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { Button } from "@/components/ui/button";
import { useMatchLiveSnapshot } from "@/lib/live/use-match-live-snapshot";
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
  scoreLabel,
  groupCode,
}: {
  homeTeam: string;
  awayTeam: string;
  scoreLabel: string;
  groupCode?: string | null;
}) {
  return (
    <div className="relative h-[1.625rem] w-full shrink-0">
      <div className="absolute left-[15%] top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
        <TeamFlagBadge name={homeTeam} size="sm" loading="eager" />
      </div>

      <div className="absolute left-1/2 top-1/2 z-[3] -translate-x-1/2 -translate-y-1/2 text-center">
        <span className="block font-display text-[1.15rem] font-semibold tabular-nums leading-none text-white/95 sm:text-xl">
          {scoreLabel}
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
    <div className="relative mt-1 flex w-full justify-center pl-1">
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
  const { snapshot: liveSnapshot } = useMatchLiveSnapshot(match.id, match.status === "finished");

  const homeGoals = match.officialHome ?? liveSnapshot?.homeScore ?? null;
  const awayGoals = match.officialAway ?? liveSnapshot?.awayScore ?? null;
  const hasScore =
    homeGoals != null &&
    awayGoals != null &&
    Number.isInteger(homeGoals) &&
    Number.isInteger(awayGoals);

  const predictedHome = match.prediction?.home_goals ?? null;
  const predictedAway = match.prediction?.away_goals ?? null;
  const hasPrediction =
    predictedHome != null &&
    predictedAway != null &&
    Number.isInteger(predictedHome) &&
    Number.isInteger(predictedAway);

  const scoreLabel = hasScore ? displayGoals(homeGoals, awayGoals) : "—";

  return (
    <div className={cn(teamsBlockClassName, "flex min-h-0 flex-col justify-between gap-1")}>
      <button type="button" className="min-h-0 shrink-0 text-left" onClick={onOpenDetail}>
        <HomeFinishedFlagsScoreRow
          homeTeam={match.home_team}
          awayTeam={match.away_team}
          scoreLabel={scoreLabel}
          groupCode={match.group_code}
        />

        {hasScore && hasPrediction ? (
          <HomeFinishedPredictionSummary
            predictedHome={predictedHome}
            predictedAway={predictedAway}
            homeGoals={homeGoals}
            awayGoals={awayGoals}
          />
        ) : null}
      </button>

      <div className="shrink-0">
        <MatchContextActionsRow
          compact
          layout="homeCardStacked"
          homeAnchor="15%"
          awayAnchor="85%"
          lineupActionTone="muted"
          hidePossibleLineups
          className="w-full"
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

      <div className="flex shrink-0 justify-center pb-0.5">
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
