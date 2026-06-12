"use client";

import { HomeSquadFooterLink } from "@/components/lineup/MatchContextActionButton";
import { MatchContextActionsRow } from "@/components/lineup/MatchContextActionsRow";
import {
  HOME_CARD_SCHEDULED_ACTIONS_STACKED_CLASS,
  HOME_CARD_SCHEDULED_ACTIONS_TOP_CLASS,
  MatchTeamsDisplay,
} from "@/components/matches/MatchTeamsDisplay";
import { MvpPredictionButton } from "@/components/predictions/MvpPredictionButton";
import { PredictionStatusBadge } from "@/components/predictions/PredictionStatusBadge";
import { useMatchLiveSnapshot } from "@/lib/live/use-match-live-snapshot";
import { displayGoals, formatListScore } from "@/lib/predictions/edit-state";
import { resolveScoreOutcome } from "@/lib/predictions/prediction-outcome";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HomeFinishedMatchPanelProps = {
  match: MatchWithPrediction;
  teamsBlockClassName: string;
  onOpenHomeLineup: () => void;
  onOpenAwayLineup: () => void;
  onOpenDetail: () => void;
};

/** Centra el contenido en el ancho completo de la card. */
function HomeFinishedCardCenter({ children }: { children: ReactNode }) {
  return <div className="flex w-full justify-center overflow-visible">{children}</div>;
}

function HomeFinishedOfficialScore({
  scoreLabel,
  onOpenDetail,
}: {
  scoreLabel: string;
  onOpenDetail: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpenDetail();
      }}
      className="pointer-events-auto font-display text-[11px] font-semibold normal-case tabular-nums text-white/95 transition-opacity hover:opacity-80"
    >
      {scoreLabel}
    </button>
  );
}

function HomeFinishedPredictedScore({
  predictedHome,
  predictedAway,
  homeGoals,
  awayGoals,
  onOpenDetail,
}: {
  predictedHome: number;
  predictedAway: number;
  homeGoals: number;
  awayGoals: number;
  onOpenDetail: () => void;
}) {
  const outcome = resolveScoreOutcome({
    predictedHome,
    predictedAway,
    resultHome: homeGoals,
    resultAway: awayGoals,
  });
  const predictedText = formatListScore(predictedHome, predictedAway);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpenDetail();
      }}
      className="pointer-events-auto relative inline-block transition-opacity hover:opacity-80"
    >
      <PredictionStatusBadge
        outcome={outcome}
        className="!left-auto !right-full mr-1 rounded-l-[2px]"
      />
      <span className="font-display text-[11px] font-semibold normal-case tabular-nums text-[var(--tm-accent)]">
        {predictedText}
      </span>
    </button>
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
    <div className={teamsBlockClassName}>
      <MatchTeamsDisplay
        homeTeam={match.home_team}
        awayTeam={match.away_team}
        kickoffAt={match.kickoff_at}
        isLive={false}
        hideKickoff
        compactTeamColumn
        teamBlocksTopClass="top-0"
        homeFooterSlot={<HomeSquadFooterLink onClick={onOpenHomeLineup} />}
        awayFooterSlot={<HomeSquadFooterLink onClick={onOpenAwayLineup} />}
        onHomeTeamClick={onOpenHomeLineup}
        onAwayTeamClick={onOpenAwayLineup}
      />

      <div
        className={cn(
          "absolute inset-x-0",
          HOME_CARD_SCHEDULED_ACTIONS_TOP_CLASS,
          HOME_CARD_SCHEDULED_ACTIONS_STACKED_CLASS,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <MatchContextActionsRow
          compact
          layout="homeCardScheduledStacked"
          homeAnchor="15%"
          awayAnchor="85%"
          className="h-full w-full"
          hidePossibleLineups
          centerSlot={
            <HomeFinishedCardCenter>
              <HomeFinishedOfficialScore scoreLabel={scoreLabel} onOpenDetail={onOpenDetail} />
            </HomeFinishedCardCenter>
          }
          predictionSlot={
            hasScore && hasPrediction ? (
              <HomeFinishedCardCenter>
                <HomeFinishedPredictedScore
                  predictedHome={predictedHome}
                  predictedAway={predictedAway}
                  homeGoals={homeGoals}
                  awayGoals={awayGoals}
                  onOpenDetail={onOpenDetail}
                />
              </HomeFinishedCardCenter>
            ) : null
          }
          bottomSlot={
            <HomeFinishedCardCenter>
              <MvpPredictionButton
                savedPlayerName={match.mvpPrediction?.player_name}
                savedTeamName={match.mvpPrediction?.team_name}
                readOnly
                officialPlayerName={match.officialMvpPlayerName}
                officialTeamName={match.officialMvpTeamName}
                variant="compact"
                finishedInline
                className="pointer-events-auto w-max"
              />
            </HomeFinishedCardCenter>
          }
          onOpenHomeLineup={onOpenHomeLineup}
          onOpenAwayLineup={onOpenAwayLineup}
          onOpenPossibleLineups={() => {}}
        />
      </div>
    </div>
  );
}
