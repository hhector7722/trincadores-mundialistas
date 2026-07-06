"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { MatchContextActionsRow } from "@/components/lineup/MatchContextActionsRow";
import { LiveScoreDisplay } from "@/components/live/LiveMatchScorePair";
import { MatchGoalScorersList } from "@/components/live/MatchGoalScorersList";
import {
  HOME_CARD_SCHEDULED_ACTIONS_STACKED_CLASS,
  HOME_CARD_SCHEDULED_ACTIONS_TOP_CLASS,
  MatchTeamsDisplay,
} from "@/components/matches/MatchTeamsDisplay";
import { MvpPredictionButton } from "@/components/predictions/MvpPredictionButton";
import { PredictionOutcomeIcon } from "@/components/predictions/PredictionOutcomeIcon";
import { resolveMatchGoalScorers } from "@/lib/live/goal-scorers";
import { useMatchLiveSnapshot } from "@/lib/live/use-match-live-snapshot";
import { formatListScore } from "@/lib/predictions/edit-state";
import { resolveScoreOutcome } from "@/lib/predictions/prediction-outcome";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const FINISHED_SCORE_CHECK_GAP_PX = 4;

type HomeFinishedMatchPanelProps = {
  match: MatchWithPrediction;
  teamsBlockClassName: string;
  onOpenHomeLineup: () => void;
  onOpenAwayLineup: () => void;
  onOpenDetail: () => void;
};

function HomeFinishedCardCenter({ children }: { children: ReactNode }) {
  return <div className="flex w-full justify-center overflow-visible">{children}</div>;
}

function HomeFinishedOfficialGoal({
  value,
  onOpenDetail,
}: {
  value: number;
  onOpenDetail: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpenDetail();
      }}
      className="pointer-events-auto transition-opacity hover:opacity-80"
    >
      <LiveScoreDisplay score={value} />
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
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [checkPos, setCheckPos] = useState<{ left: number; top: number } | null>(null);

  const outcome = resolveScoreOutcome({
    predictedHome,
    predictedAway,
    resultHome: homeGoals,
    resultAway: awayGoals,
  });
  const predictedText = formatListScore(predictedHome, predictedAway);
  const showTick = outcome === "exact";

  useLayoutEffect(() => {
    if (!showTick) {
      setCheckPos(null);
      return;
    }

    const update = () => {
      const label = labelRef.current;
      const container = containerRef.current;
      if (!label || !container) return;

      const labelRect = label.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setCheckPos({
        left: labelRect.right - containerRect.left + FINISHED_SCORE_CHECK_GAP_PX,
        top: labelRect.top - containerRect.top + labelRect.height / 2,
      });
    };

    update();

    const label = labelRef.current;
    if (!label) return;

    const observer = new ResizeObserver(update);
    observer.observe(label);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [predictedText, showTick]);

  return (
    <div ref={containerRef} className="pointer-events-auto relative w-full leading-none">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onOpenDetail();
        }}
        className="block w-full text-center font-display text-[11px] font-semibold leading-none normal-case tabular-nums text-[var(--tm-accent)] transition-opacity hover:opacity-80"
      >
        <span ref={labelRef} className="inline-block whitespace-nowrap">
          {predictedText}
        </span>
      </button>
      {showTick && checkPos != null ? (
        <span
          className="pointer-events-none absolute flex -translate-y-1/2 items-center leading-none"
          style={{ left: checkPos.left, top: checkPos.top }}
        >
          <PredictionOutcomeIcon variant="success" className="text-[11px] leading-none" />
        </span>
      ) : null}
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

  const goalScorers = resolveMatchGoalScorers(
    match.playerIncidents,
    liveSnapshot?.playerIncidents,
  );

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
        homeFooterSlot={<MatchGoalScorersList goals={goalScorers.home} />}
        awayFooterSlot={<MatchGoalScorersList goals={goalScorers.away} />}
        homeScoreSlot={
          hasScore ? (
            <HomeFinishedOfficialGoal value={homeGoals} onOpenDetail={onOpenDetail} />
          ) : null
        }
        awayScoreSlot={
          hasScore ? (
            <HomeFinishedOfficialGoal value={awayGoals} onOpenDetail={onOpenDetail} />
          ) : null
        }
      />

      {hasScore && hasPrediction ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[4] flex h-10 items-center sm:h-11">
          <HomeFinishedPredictedScore
            predictedHome={predictedHome}
            predictedAway={predictedAway}
            homeGoals={homeGoals}
            awayGoals={awayGoals}
            onOpenDetail={onOpenDetail}
          />
        </div>
      ) : null}

      <div
        className={cn(
          "absolute inset-x-0 overflow-visible pointer-events-none",
          HOME_CARD_SCHEDULED_ACTIONS_TOP_CLASS,
          HOME_CARD_SCHEDULED_ACTIONS_STACKED_CLASS,
        )}
      >
        <MatchContextActionsRow
          compact
          layout="homeCardScheduledStacked"
          homeAnchor="15%"
          awayAnchor="85%"
          className="pointer-events-auto h-full w-full"
          hidePossibleLineups
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
                className="pointer-events-auto w-full"
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
