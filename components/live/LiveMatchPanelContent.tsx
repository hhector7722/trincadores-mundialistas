"use client";

import { LiveMatchScoreOverlay, LiveScoreDisplay } from "@/components/live/LiveMatchScorePair";
import { MatchContextActionsRow } from "@/components/lineup/MatchContextActionsRow";
import { MvpPredictionButton } from "@/components/predictions/MvpPredictionButton";
import {
  HOME_CARD_ACTIONS_STACKED_CLASS,
  HOME_CARD_TEAMS_BLOCK_CLASS,
  MatchTeamsDisplay,
} from "@/components/matches/MatchTeamsDisplay";
import type { MatchLiveSnapshot } from "@/lib/live/types";
import { cn } from "@/lib/utils";

type LiveMatchPanelContentProps = {
  homeTeam: string;
  awayTeam: string;
  liveSnapshot: MatchLiveSnapshot | null;
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
          teamBlocksTopClass="top-1.5"
          onHomeTeamClick={useHomeCompactLayout ? onOpenHomeLineup : undefined}
          onAwayTeamClick={useHomeCompactLayout ? onOpenAwayLineup : undefined}
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
          className={cn("absolute inset-x-0 bottom-0 overflow-hidden", actionsClassName)}
          onClick={(event) => event.stopPropagation()}
        >
          <MatchContextActionsRow
            compact
            layout={useHomeCompactLayout ? "homeCardCompactStacked" : "homeCardStacked"}
            homeAnchor={actionsHomeAnchor}
            awayAnchor={actionsAwayAnchor}
            className="h-full"
            centerSlot={
              useHomeCompactLayout ? (
                predictionScoreText ? (
                  <p className="text-center font-display text-[11px] font-semibold normal-case tabular-nums text-[var(--tm-accent)]">
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
