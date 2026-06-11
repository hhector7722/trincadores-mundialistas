"use client";

import { LiveMatchScorePair } from "@/components/live/LiveMatchScorePair";
import { MatchContextActionsRow } from "@/components/lineup/MatchContextActionsRow";
import {
  HOME_CARD_ACTIONS_STACKED_CLASS,
  MatchTeamsDisplay,
} from "@/components/matches/MatchTeamsDisplay";
import type { MatchLiveSnapshot } from "@/lib/live/types";
import { cn } from "@/lib/utils";

type LiveMatchPanelContentProps = {
  homeTeam: string;
  awayTeam: string;
  liveSnapshot: MatchLiveSnapshot | null;
  predictionScoreText?: string | null;
  lineupsCaption: string;
  teamsBlockClassName?: string;
  actionsClassName?: string;
  onOpenHomeLineup: () => void;
  onOpenAwayLineup: () => void;
  onOpenLineups: () => void;
  className?: string;
};

export function LiveMatchPanelContent({
  homeTeam,
  awayTeam,
  liveSnapshot,
  predictionScoreText,
  lineupsCaption,
  teamsBlockClassName = "relative mt-2 min-h-[8.25rem]",
  actionsClassName = HOME_CARD_ACTIONS_STACKED_CLASS,
  onOpenHomeLineup,
  onOpenAwayLineup,
  onOpenLineups,
  className,
}: LiveMatchPanelContentProps) {
  return (
    <div className={className}>
      <div className={teamsBlockClassName}>
        {liveSnapshot ? (
          <LiveMatchScorePair homeScore={liveSnapshot.homeScore} awayScore={liveSnapshot.awayScore} />
        ) : null}

        <MatchTeamsDisplay
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          kickoffAt=""
          isLive
          hideKickoff
          teamBlocksTopClass="top-1.5"
          onHomeTeamClick={onOpenHomeLineup}
          onAwayTeamClick={onOpenAwayLineup}
          centerSlotAlign="teamNames"
          centerSlot={
            predictionScoreText ? (
              <p className="text-center font-display text-sm font-semibold normal-case tabular-nums text-[var(--tm-accent)]">
                {predictionScoreText}
              </p>
            ) : null
          }
        />

        <div
          className={cn("absolute inset-x-0 bottom-0", actionsClassName)}
          onClick={(event) => event.stopPropagation()}
        >
          <MatchContextActionsRow
            compact
            layout="homeCardStacked"
            homeAnchor="15%"
            awayAnchor="85%"
            className="h-full"
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
