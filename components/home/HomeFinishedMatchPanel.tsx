"use client";

import { MatchContextActionsRow } from "@/components/lineup/MatchContextActionsRow";
import { MvpPredictionButton } from "@/components/predictions/MvpPredictionButton";
import { PredictionStatusBadge } from "@/components/predictions/PredictionStatusBadge";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { useMatchLiveSnapshot } from "@/lib/live/use-match-live-snapshot";
import { displayGoals, formatListScore } from "@/lib/predictions/edit-state";
import { resolveScoreOutcome } from "@/lib/predictions/prediction-outcome";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";
import type { MouseEvent } from "react";

type HomeFinishedMatchPanelProps = {
  match: MatchWithPrediction;
  teamsBlockClassName: string;
  onOpenHomeLineup: () => void;
  onOpenAwayLineup: () => void;
  onOpenDetail: () => void;
};

function openLineup(event: MouseEvent, onOpen: () => void) {
  event.stopPropagation();
  onOpen();
}

function HomeFinishedTeamColumn({
  team,
  side,
  onOpenLineup,
}: {
  team: string;
  side: "home" | "away";
  onOpenLineup: () => void;
}) {
  const anchor = side === "home" ? "15%" : "85%";

  return (
    <div
      className="absolute top-1/2 z-[2] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
      style={{ left: anchor }}
    >
      <button
        type="button"
        onClick={(event) => openLineup(event, onOpenLineup)}
        className="shrink-0 rounded-full transition-opacity hover:opacity-80 active:opacity-70"
        aria-label={`Ver plantilla de ${teamNameEs(team)}`}
      >
        <TeamFlagBadge name={team} size="sm" loading="eager" />
      </button>
      <button
        type="button"
        onClick={(event) => openLineup(event, onOpenLineup)}
        className="max-w-[4.5rem] truncate text-center text-[8px] font-semibold leading-tight text-[var(--tm-fg)] transition-opacity hover:opacity-80 active:opacity-70"
        aria-label={`Ver plantilla de ${teamNameEs(team)}`}
      >
        {teamNameEs(team)}
      </button>
    </div>
  );
}

function HomeFinishedFlagsScoreRow({
  homeTeam,
  awayTeam,
  scoreLabel,
  onOpenHomeLineup,
  onOpenAwayLineup,
}: {
  homeTeam: string;
  awayTeam: string;
  scoreLabel: string;
  onOpenHomeLineup: () => void;
  onOpenAwayLineup: () => void;
}) {
  return (
    <div className="relative h-[2.25rem] w-full shrink-0">
      <HomeFinishedTeamColumn team={homeTeam} side="home" onOpenLineup={onOpenHomeLineup} />
      <HomeFinishedTeamColumn team={awayTeam} side="away" onOpenLineup={onOpenAwayLineup} />

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 text-center">
        <span className="block font-display text-[1.15rem] font-semibold tabular-nums leading-none text-white/95 sm:text-xl">
          {scoreLabel}
        </span>
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
    <div className="relative mt-0.5 flex w-full items-center justify-center gap-1 pl-1">
      <PredictionStatusBadge outcome={outcome} />
      <p className="text-center font-display text-[8px] font-semibold tabular-nums leading-none text-[var(--tm-accent)]">
        {predictedText}
      </p>
    </div>
  );
}

export function HomeFinishedMatchPanel({
  match,
  teamsBlockClassName,
  onOpenHomeLineup,
  onOpenAwayLineup,
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
    <div className={cn(teamsBlockClassName, "flex min-h-0 flex-col justify-between")}>
      <div className="min-h-0 shrink-0">
        <HomeFinishedFlagsScoreRow
          homeTeam={match.home_team}
          awayTeam={match.away_team}
          scoreLabel={scoreLabel}
          onOpenHomeLineup={onOpenHomeLineup}
          onOpenAwayLineup={onOpenAwayLineup}
        />

        {hasScore && hasPrediction ? (
          <button type="button" className="w-full text-left" onClick={onOpenDetail}>
            <HomeFinishedPredictionSummary
              predictedHome={predictedHome}
              predictedAway={predictedAway}
              homeGoals={homeGoals}
              awayGoals={awayGoals}
            />
          </button>
        ) : null}
      </div>

      <div className="mt-auto shrink-0 pt-0.5" onClick={(event) => event.stopPropagation()}>
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
              finishedInline
              className="w-full"
            />
          }
          onOpenHomeLineup={onOpenHomeLineup}
          onOpenAwayLineup={onOpenAwayLineup}
          onOpenPossibleLineups={() => {}}
        />
      </div>
    </div>
  );
}
