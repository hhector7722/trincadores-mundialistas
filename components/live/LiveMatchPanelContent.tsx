"use client";

import { LiveMatchScoreOverlay, LiveScoreDisplay } from "@/components/live/LiveMatchScorePair";
import { MatchGoalScorersList } from "@/components/live/MatchGoalScorersList";
import { MatchContextActionsRow } from "@/components/lineup/MatchContextActionsRow";
import { MvpPredictionButton } from "@/components/predictions/MvpPredictionButton";
import {
  HOME_CARD_ACTIONS_STACKED_CLASS,
  HOME_CARD_TEAMS_BLOCK_CLASS,
  MatchTeamsDisplay,
} from "@/components/matches/MatchTeamsDisplay";
import { resolveMatchGoalScorers } from "@/lib/live/goal-scorers";
import type { MatchLiveSnapshot, MatchPlayerIncident } from "@/lib/live/types";
import { cn } from "@/lib/utils";

type LiveMatchPanelContentProps = {
  homeTeam: string;
  awayTeam: string;
  liveSnapshot: MatchLiveSnapshot | null;
  playerIncidents?: MatchPlayerIncident[];
  predictionScoreText?: string | null;
  mvpPlayerName?: string | null;
  mvpTeamName?: string | null;
  lineupsCaption: string;
  teamsBlockClassName?: string;
  actionsClassName?: string;
  onOpenHomeLineup: () => void;
  onOpenAwayLineup: () => void;
  onOpenLineups: () => void;
  className?: string;
  /** Modal pronóstico: banderas 10/90 y marcador 34/66; card inicio: 15/85 y 32.5/67.5. */
  teamsLayout?: "default" | "predictionModal";
};

export function LiveMatchPanelContent({
  homeTeam,
  awayTeam,
  liveSnapshot,
  playerIncidents = [],
  predictionScoreText,
  mvpPlayerName,
  mvpTeamName,
  lineupsCaption,
  teamsBlockClassName = HOME_CARD_TEAMS_BLOCK_CLASS,
  actionsClassName = HOME_CARD_ACTIONS_STACKED_CLASS,
  onOpenHomeLineup,
  onOpenAwayLineup,
  onOpenLineups,
  className,
  teamsLayout = "default",
}: LiveMatchPanelContentProps) {
  const isModalLayout = teamsLayout === "predictionModal";
  const actionsHomeAnchor = isModalLayout ? "10%" : "15%";
  const actionsAwayAnchor = isModalLayout ? "90%" : "85%";
  const useHomeCompactLayout = !isModalLayout;
  const goalScorers = resolveMatchGoalScorers(
    playerIncidents,
    liveSnapshot?.playerIncidents,
  );

  return (
    <div className={className}>
      <div className={teamsBlockClassName}>
        <MatchTeamsDisplay
          layout={teamsLayout}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          kickoffAt=""
          isLive
          hideKickoff
          hidePredictionLabel={isModalLayout}
          compactTeamColumn={useHomeCompactLayout}
          teamBlocksTopClass={useHomeCompactLayout ? "top-0" : "top-1.5"}
          homeFooterSlot={
            <MatchGoalScorersList goals={goalScorers.home} align={isModalLayout ? "left" : "center"} />
          }
          awayFooterSlot={
            <MatchGoalScorersList goals={goalScorers.away} align={isModalLayout ? "right" : "center"} />
          }
          homeScoreSlot={
            !isModalLayout && liveSnapshot ? (
              <LiveScoreDisplay score={liveSnapshot.homeScore} />
            ) : undefined
          }
          awayScoreSlot={
            !isModalLayout && liveSnapshot ? (
              <LiveScoreDisplay score={liveSnapshot.awayScore} />
            ) : undefined
          }
          centerSlot={
            isModalLayout && predictionScoreText ? (
              <div className="inline-block text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/60">
                  Mi pronóstico
                </p>
                <p className="font-display text-sm font-semibold normal-case tabular-nums text-[var(--tm-accent)]">
                  {predictionScoreText}
                </p>
              </div>
            ) : null
          }
          centerSlotAlign={isModalLayout ? "teamNames" : undefined}
        />

        {isModalLayout && liveSnapshot ? (
          <LiveMatchScoreOverlay
            homeScore={liveSnapshot.homeScore}
            awayScore={liveSnapshot.awayScore}
            variant="modal"
          />
        ) : null}

        <div
          className={cn("absolute inset-x-0 bottom-0 pointer-events-none", actionsClassName)}
        >
          <MatchContextActionsRow
            compact
            layout={useHomeCompactLayout ? "homeCardCompactStacked" : "homeCardStacked"}
            homeAnchor={actionsHomeAnchor}
            awayAnchor={actionsAwayAnchor}
            hideLineupButtons
            className={cn("pointer-events-auto", useHomeCompactLayout ? "h-full" : undefined)}
            centerSlot={
              useHomeCompactLayout ? (
                predictionScoreText ? (
                  <p className="mt-1.5 text-center font-display text-[11px] font-semibold normal-case tabular-nums text-[var(--tm-accent)]">
                    {predictionScoreText}
                  </p>
                ) : mvpPlayerName ? (
                  <MvpPredictionButton
                    savedPlayerName={mvpPlayerName}
                    savedTeamName={mvpTeamName}
                    variant="compact"
                    readOnly
                    className="w-full"
                  />
                ) : null
              ) : mvpPlayerName ? (
                <MvpPredictionButton
                  savedPlayerName={mvpPlayerName}
                  savedTeamName={mvpTeamName}
                  variant="compact"
                  readOnly
                  className="w-full"
                />
              ) : null
            }
            predictionSlot={
              useHomeCompactLayout && predictionScoreText && mvpPlayerName ? (
                <MvpPredictionButton
                  savedPlayerName={mvpPlayerName}
                  savedTeamName={mvpTeamName}
                  variant="compact"
                  readOnly
                  className="w-full"
                />
              ) : null
            }
            onOpenHomeLineup={onOpenHomeLineup}
            onOpenAwayLineup={onOpenAwayLineup}
            possibleLineupsCaption={lineupsCaption}
            onOpenPossibleLineups={onOpenLineups}
          />
        </div>
      </div>
    </div>
  );
}
