"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { fetchMatchLineupsStatusAction } from "@/actions/lineup";
import { fetchSavedMvpPlayerName } from "@/actions/mvp-predictions";
import { savePrediction } from "@/actions/predictions";
import {
  buildLineupView,
  buildMvpView,
  buildPossibleLineupsView,
} from "@/components/lineup/EntityModalController";
import { LineupModalPanel } from "@/components/lineup/LineupModalPanel";
import { MatchContextActionsRow } from "@/components/lineup/MatchContextActionsRow";
import { MvpPickPanel } from "@/components/lineup/MvpPickPanel";
import { PossibleLineupsPanel } from "@/components/lineup/PossibleLineupsPanel";
import { FinishedMatchScoreRow } from "@/components/predictions/FinishedMatchScoreRow";
import { MatchPredictionsBoardModal } from "@/components/predictions/MatchPredictionsBoardModal";
import { MvpPredictionButton } from "@/components/predictions/MvpPredictionButton";
import { PlayerDetailPanel } from "@/components/lineup/PlayerDetailPanel";
import { entityModalTitleContent } from "@/components/lineup/EntityModalTitle";
import type { EntityModalView } from "@/components/lineup/entity-modal-types";
import {
  MatchTeamsDisplay,
  PREDICTION_MODAL_ACTIONS_ROW_CLASS,
  PREDICTION_MODAL_ACTIONS_STACKED_CLASS,
  PREDICTION_MODAL_TEAMS_BLOCK_MIN_H_CLASS,
} from "@/components/matches/MatchTeamsDisplay";
import { PredictionDeadlineCountdown } from "@/components/predictions/PredictionDeadlineCountdown";
import { ScoreStepper } from "@/components/predictions/ScoreStepper";
import { Button } from "@/components/ui/button";
import { Modal, type ModalPanelSlide } from "@/components/ui/modal";
import { MatchHighlightBlock } from "@/components/highlights/MatchHighlightBlock";
import { LiveMatchHeaderLabel } from "@/components/live/LiveMatchHeaderLabel";
import { LiveMatchScoreOverlay } from "@/components/live/LiveMatchScorePair";
import { MatchLiveStatsPanel } from "@/components/live/MatchLiveStatsPanel";
import { MatchStatsModal, MatchStatsOpenButton } from "@/components/live/MatchStatsModal";
import {
  lineupsActionCaption,
  lineupsModalTitle,
  POSSIBLE_LINEUPS_ACTION_CAPTION,
} from "@/lib/lineup/lineups-modal-copy";
import { useMatchLiveSnapshot } from "@/lib/live/use-match-live-snapshot";
import { formatListScore } from "@/lib/predictions/edit-state";
import { resolvePredictionUiState } from "@/lib/predictions/edit-state";
import {
  mergeMvpIntoMatch,
  mvpOverridesFromMatchListAndActive,
  mvpPlayerNameFromMatch,
  preferMatchMvpData,
  type MvpSnapshot,
} from "@/lib/predictions/mvp-match-state";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import {
  LINEUP_MODAL_PANEL_CLASS,
  LINEUP_MODAL_PANEL_HOST_CLASS,
  LINEUP_MODAL_WRAPPER_CLASS,
  MVP_MODAL_PICK_PANEL_CLASS,
  POSSIBLE_LINEUPS_MODAL_PANEL_CLASS,
  MVP_MODAL_WRAPPER_CLASS,
  PLAYER_MODAL_PANEL_CLASS,
  PLAYER_MODAL_PANEL_HOST_CLASS,
  PLAYER_MODAL_WRAPPER_CLASS,
} from "@/lib/lineup/field-asset";
import { buildBoardCarouselMatches } from "@/lib/predictions/board-carousel";
import { formatKickoff } from "@/lib/pool/format-kickoff";
import { usePanelSlideStack } from "@/lib/ui/use-panel-slide-stack";
import { CarouselSwipeDots, useCarouselSlide } from "@/lib/ui/use-carousel-slide";
import { cn } from "@/lib/utils";

type QuickPredictionModalProps = {
  open: boolean;
  onClose: () => void;
  poolId: string;
  match: MatchWithPrediction;
  matches?: MatchWithPrediction[];
  onMatchChange?: (match: MatchWithPrediction) => void;
  onMvpSaved?: (
    matchId: string,
    playerName: string,
    teamName: string,
    shirtNumber?: number | null
  ) => void;
  /** Panel y backdrop opacos (calendario). */
  opaque?: boolean;
  /** Círculo de bandera sin imagen: negro y negrita (eliminatoria). */
  flagPlaceholderStyle?: "default" | "knockout";
  /** Necesario para abrir el tablero de pronósticos rivales (live/finalizado). */
  currentProfileId?: string;
};

type DotPosition = "start" | "middle" | "end";
type QuickPanelView = { kind: "prediction" } | EntityModalView;

type MatchSlideState = {
  target: MatchWithPrediction;
  direction: "next" | "prev";
  phase: "prep" | "animate";
};

const SLIDE_MS = 300;

function sortMatchesByKickoff(items: MatchWithPrediction[]): MatchWithPrediction[] {
  return [...items].sort(
    (a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime()
  );
}

function resolveDotPosition(index: number, total: number): DotPosition {
  if (total <= 1 || index <= 0) return "start";
  if (index >= total - 1) return "end";
  return "middle";
}

function PredictionsBoardOpenButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-center">
      <Button
        type="button"
        className="!min-h-0 h-auto w-auto px-3 py-1 text-[10px] leading-none uppercase tracking-[0.12em]"
        onClick={onClick}
      >
        Ver pronósticos
      </Button>
    </div>
  );
}

function FinishedModalFooterActions({
  currentProfileId,
  onOpenPredictionsBoard,
  onOpenStats,
  highlight,
}: {
  currentProfileId?: string;
  onOpenPredictionsBoard: () => void;
  onOpenStats: () => void;
  highlight?: ReactNode;
}) {
  return (
    <div className="mt-auto shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
      {currentProfileId ? (
        <PredictionsBoardOpenButton onClick={onOpenPredictionsBoard} />
      ) : null}
      <MatchStatsOpenButton
        onClick={onOpenStats}
        tone="muted"
        className={currentProfileId ? "mt-1" : undefined}
      />
      {highlight}
    </div>
  );
}

function MatchSwipeDots({ position }: { position: DotPosition }) {
  return (
    <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
      {[0, 1, 2].map((dot) => {
        const active =
          (position === "start" && dot === 0) ||
          (position === "middle" && dot === 1) ||
          (position === "end" && dot === 2);

        return (
          <span
            key={dot}
            className={cn(
              "rounded-full transition-all duration-200",
              active ? "h-2 w-2 bg-white" : "h-1.5 w-1.5 bg-white/35"
            )}
          />
        );
      })}
    </div>
  );
}

function quickPanelTitle(
  view: QuickPanelView,
  options?: {
    lineupFormation?: string;
    possibleLineupsTitle?: string;
    possibleLineupsConfirmed?: boolean;
  },
): ReactNode {
  if (view.kind === "prediction") return "Pronóstico";
  return entityModalTitleContent(view, {
    lineupFormation: view.kind === "lineup" ? options?.lineupFormation : undefined,
    possibleLineupsTitle: view.kind === "possible-lineups" ? options?.possibleLineupsTitle : undefined,
    possibleLineupsConfirmed:
      view.kind === "possible-lineups" ? options?.possibleLineupsConfirmed : undefined,
  });
}

export function QuickPredictionModal({
  open,
  onClose,
  poolId,
  match,
  matches,
  onMatchChange,
  onMvpSaved,
  opaque = false,
  flagPlaceholderStyle = "default",
  currentProfileId,
}: QuickPredictionModalProps) {
  const router = useRouter();
  const orderedMatches = useMemo(
    () => (matches && matches.length > 0 ? sortMatchesByKickoff(matches) : [match]),
    [match, matches]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [lineupFormation, setLineupFormation] = useState<string | undefined>();
  const [possibleLineupsTitle, setPossibleLineupsTitle] = useState<string | undefined>();
  const [possibleLineupsConfirmed, setPossibleLineupsConfirmed] = useState(false);
  const [possibleLineupsCaption, setPossibleLineupsCaption] = useState(
    POSSIBLE_LINEUPS_ACTION_CAPTION,
  );
  const [mvpOverrides, setMvpOverrides] = useState<Record<string, MvpSnapshot>>({});
  const [mvpPlayerName, setMvpPlayerName] = useState<string | null>(null);
  const [predictionsBoardOpen, setPredictionsBoardOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [matchSlide, setMatchSlide] = useState<MatchSlideState | null>(null);
  const matchSlideLockRef = useRef(false);
  const matchSlideTimerRef = useRef<number | null>(null);
  const onMatchChangeRef = useRef(onMatchChange);
  const wasOpenRef = useRef(false);

  const baseViewMatch = useMemo(
    () => preferMatchMvpData(orderedMatches[activeIndex] ?? match, match),
    [activeIndex, orderedMatches, match]
  );
  const viewMatch = useMemo(
    () => mergeMvpIntoMatch(baseViewMatch, mvpOverrides[baseViewMatch.id]),
    [baseViewMatch, mvpOverrides]
  );
  const isLiveMatch = viewMatch.status === "live";
  const isFinishedMatch = viewMatch.status === "finished";
  const hidePossibleLineupsForView = isFinishedMatch;
  const shouldLoadLiveSnapshot = open && (isLiveMatch || isFinishedMatch);
  const { snapshot: liveSnapshot } = useMatchLiveSnapshot(viewMatch.id, shouldLoadLiveSnapshot);
  const highlightVideoId = viewMatch.highlightYoutubeId;
  const canSwipeMatches = orderedMatches.length > 1 && Boolean(onMatchChange);
  const dotPosition = resolveDotPosition(activeIndex, orderedMatches.length);
  const boardCarouselMatches = useMemo(
    () => buildBoardCarouselMatches(orderedMatches),
    [orderedMatches],
  );

  const {
    current: panelView,
    canGoBack,
    push,
    pop,
    reset,
    replaceCurrent,
    isSliding: isPanelSliding,
    buildPanelSlide,
  } = usePanelSlideStack<QuickPanelView>({ kind: "prediction" });

  const atPredictionRoot = panelView.kind === "prediction";
  const atLineupCarousel = panelView.kind === "lineup";

  const matchTeams = useMemo(
    () => [viewMatch.home_team, viewMatch.away_team],
    [viewMatch.home_team, viewMatch.away_team]
  );
  const lineupTeamName = panelView.kind === "lineup" ? panelView.teamName : viewMatch.home_team;

  useEffect(() => {
    if (panelView.kind === "lineup") {
      setLineupFormation(undefined);
    }
    if (panelView.kind === "possible-lineups") {
      setPossibleLineupsTitle(undefined);
      setPossibleLineupsConfirmed(false);
    }
  }, [lineupTeamName, panelView.kind]);

  useEffect(() => {
    if (!open || hidePossibleLineupsForView) return;
    let cancelled = false;
    void fetchMatchLineupsStatusAction(
      viewMatch.id,
      viewMatch.home_team,
      viewMatch.away_team,
    ).then((result) => {
      if (cancelled || !result.ok) return;
      setPossibleLineupsConfirmed(result.data.bothConfirmed);
      setPossibleLineupsCaption(
        lineupsActionCaption({
          bothConfirmed: result.data.bothConfirmed,
          isLive: viewMatch.status === "live",
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [hidePossibleLineupsForView, open, viewMatch.id, viewMatch.home_team, viewMatch.away_team, viewMatch.status]);

  const {
    activeIndex: teamCarouselIndex,
    canSwipe: canSwipeTeams,
    startSlide: startTeamSlide,
    buildCarouselPanelSlide: buildTeamCarouselSlide,
    isCarouselSliding,
  } = useCarouselSlide({
    items: matchTeams,
    open,
    initialItemKey: lineupTeamName,
    getItemKey: (team) => team,
    enabled: matchTeams.length > 1,
    canSlide: atLineupCarousel && !isPanelSliding && !matchSlide,
    onItemChange: (teamName) => {
      replaceCurrent(buildLineupView(teamName, viewMatch.id));
    },
  });

  const savedHome = viewMatch.prediction?.home_goals ?? null;
  const savedAway = viewMatch.prediction?.away_goals ?? null;
  const [home, setHome] = useState(savedHome ?? 0);
  const [away, setAway] = useState(savedAway ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  onMatchChangeRef.current = onMatchChange;

  useEffect(() => {
    reset({ kind: "prediction" });
    setHome(savedHome ?? 0);
    setAway(savedAway ?? 0);
    setError(null);
  }, [viewMatch.id, savedHome, savedAway, reset]);

  const draftDirty = home !== (savedHome ?? 0) || away !== (savedAway ?? 0);
  const uiState = useMemo(
    () =>
      resolvePredictionUiState({
        savedHome,
        savedAway,
        draftHome: home,
        draftAway: away,
        draftDirty,
        matchStatus: viewMatch.status,
        serverEditable: viewMatch.serverEditable,
      }),
    [savedHome, savedAway, home, away, draftDirty, viewMatch.status, viewMatch.serverEditable]
  );

  const controlsDisabled = uiState === "locked" || pending;
  const canSave = uiState !== "locked" && (uiState !== "saved" || draftDirty);

  const clearMatchSlideTimer = useCallback(() => {
    if (matchSlideTimerRef.current !== null) {
      window.clearTimeout(matchSlideTimerRef.current);
      matchSlideTimerRef.current = null;
    }
  }, []);

  const finishMatchSlide = useCallback(() => {
    clearMatchSlideTimer();
    if (!matchSlideLockRef.current) return;
    matchSlideLockRef.current = false;

    setMatchSlide((current) => {
      if (!current) return null;
      const nextIndex = orderedMatches.findIndex((item) => item.id === current.target.id);
      if (nextIndex >= 0) setActiveIndex(nextIndex);
      onMatchChangeRef.current?.(current.target);
      return null;
    });
  }, [clearMatchSlideTimer, orderedMatches]);

  const finishMatchSlideRef = useRef(finishMatchSlide);
  finishMatchSlideRef.current = finishMatchSlide;

  const handleMvpSaved = useCallback(
    (
      matchId: string,
      playerName: string,
      teamName: string,
      shirtNumber?: number | null
    ) => {
      const trimmedName = playerName.trim();
      setMvpOverrides((current) => ({
        ...current,
        [matchId]: {
          player_name: playerName,
          team_name: teamName,
          shirt_number: shirtNumber ?? null,
        },
      }));
      if (matchId === viewMatch.id && trimmedName) {
        setMvpPlayerName(trimmedName);
      }
      onMvpSaved?.(matchId, playerName, teamName, shirtNumber);
      if (panelView.kind === "mvp" && panelView.matchId === matchId) {
        replaceCurrent({
          ...panelView,
          savedPlayerName: playerName,
          savedTeamName: teamName,
          savedShirtNumber: shirtNumber ?? null,
        });
      }
    },
    [onMvpSaved, panelView, replaceCurrent, viewMatch.id]
  );

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      clearMatchSlideTimer();
      matchSlideLockRef.current = false;
      setMatchSlide(null);
      setMvpOverrides({});
      setMvpPlayerName(null);
      setPredictionsBoardOpen(false);
      setStatsModalOpen(false);
      return;
    }

    const idx = orderedMatches.findIndex((item) => item.id === match.id);
    if (idx >= 0) setActiveIndex(idx);

    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      setMatchSlide(null);
      matchSlideLockRef.current = false;
      setMvpOverrides(mvpOverridesFromMatchListAndActive(orderedMatches, match));
    }
  }, [open, match, orderedMatches, clearMatchSlideTimer]);

  useEffect(() => {
    if (!open) return;

    const fromView = mvpPlayerNameFromMatch(viewMatch);
    setMvpPlayerName(fromView);

    let cancelled = false;
    void fetchSavedMvpPlayerName(poolId, viewMatch.id)
      .then((name) => {
        if (!cancelled) setMvpPlayerName(name);
      })
      .catch(() => {
        if (!cancelled) setMvpPlayerName(fromView);
      });

    return () => {
      cancelled = true;
    };
  }, [
    open,
    poolId,
    viewMatch.id,
    viewMatch.mvpPrediction?.player_name,
    viewMatch.mvpPrediction?.updated_at,
  ]);

  useEffect(() => () => clearMatchSlideTimer(), [clearMatchSlideTimer]);

  const startMatchSlide = useCallback(
    (offset: 1 | -1) => {
      if (!canSwipeMatches || matchSlideLockRef.current || !atPredictionRoot || isPanelSliding) return;

      const nextIndex = activeIndex + offset;
      if (nextIndex < 0 || nextIndex >= orderedMatches.length) return;
      const target = orderedMatches[nextIndex];
      if (!target) return;

      clearMatchSlideTimer();
      matchSlideLockRef.current = true;
      setMatchSlide({ target, direction: offset === 1 ? "next" : "prev", phase: "prep" });

      matchSlideTimerRef.current = window.setTimeout(() => {
        finishMatchSlideRef.current();
      }, SLIDE_MS + 80);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setMatchSlide((current) => (current ? { ...current, phase: "animate" } : current));
        });
      });
    },
    [
      activeIndex,
      atPredictionRoot,
      canSwipeMatches,
      clearMatchSlideTimer,
      isPanelSliding,
      orderedMatches,
    ]
  );

  function onSave() {
    setError(null);
    startTransition(async () => {
      const result = await savePrediction(poolId, viewMatch.id, home, away);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setHome(result.home);
      setAway(result.away);
      onClose();
      router.refresh();
    });
  }

  function renderMvpCenterSlot(targetMatch: MatchWithPrediction) {
    const isFinished = targetMatch.status === "finished";
    const savedTeamName = targetMatch.mvpPrediction?.team_name ?? null;

    return (
      <MvpPredictionButton
        savedPlayerName={mvpPlayerName}
        savedTeamName={savedTeamName}
        readOnly={targetMatch.status === "live" || isFinished}
        officialPlayerName={isFinished ? targetMatch.officialMvpPlayerName : undefined}
        officialTeamName={isFinished ? targetMatch.officialMvpTeamName : undefined}
        onClick={
          targetMatch.status === "scheduled"
            ? () =>
                push(
                  buildMvpView(poolId, {
                    ...targetMatch,
                    mvpPrediction: mvpPlayerName
                      ? {
                          id: targetMatch.mvpPrediction?.id ?? "",
                          player_name: mvpPlayerName,
                          team_name: savedTeamName ?? "",
                          shirt_number: targetMatch.mvpPrediction?.shirt_number ?? null,
                          points_awarded: targetMatch.mvpPrediction?.points_awarded ?? null,
                          updated_at:
                            targetMatch.mvpPrediction?.updated_at ?? new Date().toISOString(),
                        }
                      : targetMatch.mvpPrediction,
                  })
                )
            : undefined
        }
        variant="compact"
        className="w-full"
      />
    );
  }

  function renderPanelView(view: QuickPanelView, targetMatch: MatchWithPrediction) {
    const hidePossibleLineups = targetMatch.status === "finished";
    const predictionModalActionsClass = hidePossibleLineups
      ? PREDICTION_MODAL_ACTIONS_ROW_CLASS
      : PREDICTION_MODAL_ACTIONS_STACKED_CLASS;
    const finishedHomeGoals =
      targetMatch.officialHome ?? liveSnapshot?.homeScore ?? null;
    const finishedAwayGoals =
      targetMatch.officialAway ?? liveSnapshot?.awayScore ?? null;
    const hasFinishedScore =
      finishedHomeGoals != null && finishedAwayGoals != null;

    if (
      view.kind === "prediction" &&
      targetMatch.status === "finished" &&
      hasFinishedScore
    ) {
      return (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-4 pb-0 pt-2">
            <div
              className={cn(
                "relative mt-2 pb-1",
                PREDICTION_MODAL_TEAMS_BLOCK_MIN_H_CLASS
              )}
            >
              <MatchTeamsDisplay
                layout="predictionModal"
                hidePredictionLabel
                flagPlaceholderStyle={flagPlaceholderStyle}
                homeTeam={targetMatch.home_team}
                awayTeam={targetMatch.away_team}
                kickoffAt={targetMatch.kickoff_at}
                isLive={false}
                onHomeTeamClick={() => push(buildLineupView(targetMatch.home_team, targetMatch.id))}
                onAwayTeamClick={() => push(buildLineupView(targetMatch.away_team, targetMatch.id))}
              />

              <FinishedMatchScoreRow
                homeGoals={finishedHomeGoals}
                awayGoals={finishedAwayGoals}
                predictedHome={targetMatch.prediction?.home_goals ?? null}
                predictedAway={targetMatch.prediction?.away_goals ?? null}
              />

              <div
                className={cn("absolute inset-x-0 bottom-0", predictionModalActionsClass)}
                onClick={(event) => event.stopPropagation()}
              >
                <MatchContextActionsRow
                  compact
                  layout="homeCardStacked"
                  homeAnchor="10%"
                  awayAnchor="90%"
                  lineupActionTone="muted"
                  className="h-full"
                  centerSlot={renderMvpCenterSlot(targetMatch)}
                  hidePossibleLineups={hidePossibleLineups}
                  onOpenHomeLineup={() => push(buildLineupView(targetMatch.home_team, targetMatch.id))}
                  onOpenAwayLineup={() => push(buildLineupView(targetMatch.away_team, targetMatch.id))}
                  possibleLineupsCaption={possibleLineupsCaption}
                  possibleLineupsConfirmed={possibleLineupsConfirmed}
                  onOpenPossibleLineups={() => push(buildPossibleLineupsView(targetMatch))}
                />
              </div>
            </div>
          </div>

          <FinishedModalFooterActions
            currentProfileId={currentProfileId}
            onOpenPredictionsBoard={() => setPredictionsBoardOpen(true)}
            onOpenStats={() => setStatsModalOpen(true)}
            highlight={
              highlightVideoId ? (
                <MatchHighlightBlock
                  homeTeam={targetMatch.home_team}
                  awayTeam={targetMatch.away_team}
                  homeGoals={finishedHomeGoals}
                  awayGoals={finishedAwayGoals}
                  youtubeVideoId={highlightVideoId}
                  highlightSource={targetMatch.highlightSource}
                  compactThumbnail
                  className="mt-3"
                />
              ) : null
            }
          />
        </div>
      );
    }

    if (view.kind === "prediction" && targetMatch.status === "live") {
      const predictionScoreText = formatListScore(
        targetMatch.prediction?.home_goals ?? null,
        targetMatch.prediction?.away_goals ?? null,
      );
      const liveLineupsCaption = lineupsActionCaption({
        bothConfirmed: possibleLineupsConfirmed,
        isLive: true,
      });

      return (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-4 pb-0 pt-2">
            <div
              className={cn(
                "relative mt-2 pb-1",
                PREDICTION_MODAL_TEAMS_BLOCK_MIN_H_CLASS,
              )}
            >
              <MatchTeamsDisplay
                layout="predictionModal"
                hidePredictionLabel
                flagPlaceholderStyle={flagPlaceholderStyle}
                homeTeam={targetMatch.home_team}
                awayTeam={targetMatch.away_team}
                kickoffAt={targetMatch.kickoff_at}
                isLive
                onHomeTeamClick={() => push(buildLineupView(targetMatch.home_team, targetMatch.id))}
                onAwayTeamClick={() => push(buildLineupView(targetMatch.away_team, targetMatch.id))}
                centerSlotAlign="teamNames"
                centerSlot={
                  targetMatch.prediction?.home_goals != null ? (
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
              />

              {liveSnapshot ? (
                <LiveMatchScoreOverlay
                  homeScore={liveSnapshot.homeScore}
                  awayScore={liveSnapshot.awayScore}
                  variant="modal"
                />
              ) : null}

              <div
                className={cn("absolute inset-x-0 bottom-0", predictionModalActionsClass)}
                onClick={(event) => event.stopPropagation()}
              >
                <MatchContextActionsRow
                  compact
                  layout="homeCardStacked"
                  homeAnchor="10%"
                  awayAnchor="90%"
                  lineupActionTone="muted"
                  className="h-full"
                  centerSlot={renderMvpCenterSlot(targetMatch)}
                  hidePossibleLineups={hidePossibleLineups}
                  onOpenHomeLineup={() => push(buildLineupView(targetMatch.home_team, targetMatch.id))}
                  onOpenAwayLineup={() => push(buildLineupView(targetMatch.away_team, targetMatch.id))}
                  possibleLineupsCaption={liveLineupsCaption}
                  onOpenPossibleLineups={() => push(buildPossibleLineupsView(targetMatch))}
                />
              </div>
            </div>
          </div>
          <div className="mt-auto shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            {currentProfileId ? (
              <PredictionsBoardOpenButton onClick={() => setPredictionsBoardOpen(true)} />
            ) : null}
            <MatchLiveStatsPanel
              stats={liveSnapshot?.stats ?? null}
              className={currentProfileId ? "mt-3" : undefined}
            />
          </div>
        </div>
      );
    }

    if (view.kind === "prediction") {
      return (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-4 pb-0 pt-2">
            <div
              className={cn(
                "relative mt-2 pb-1",
                PREDICTION_MODAL_TEAMS_BLOCK_MIN_H_CLASS
              )}
            >
              <MatchTeamsDisplay
                layout="predictionModal"
                flagPlaceholderStyle={flagPlaceholderStyle}
                homeTeam={targetMatch.home_team}
                awayTeam={targetMatch.away_team}
                kickoffAt={targetMatch.kickoff_at}
                isLive={targetMatch.status === "live"}
                onHomeTeamClick={() => push(buildLineupView(targetMatch.home_team, targetMatch.id))}
                onAwayTeamClick={() => push(buildLineupView(targetMatch.away_team, targetMatch.id))}
                homeScoreSlot={
                  <ScoreStepper
                    label={targetMatch.home_team}
                    value={home}
                    disabled={controlsDisabled}
                    onChange={setHome}
                    variant="floating"
                    hideLabel
                  />
                }
                awayScoreSlot={
                  <ScoreStepper
                    label={targetMatch.away_team}
                    value={away}
                    disabled={controlsDisabled}
                    onChange={setAway}
                    variant="floating"
                    hideLabel
                  />
                }
              />

              <div
                className={cn("absolute inset-x-0 bottom-0", predictionModalActionsClass)}
                onClick={(event) => event.stopPropagation()}
              >
                <MatchContextActionsRow
                  compact
                  layout="homeCardStacked"
                  homeAnchor="10%"
                  awayAnchor="90%"
                  className="h-full"
                  centerSlot={renderMvpCenterSlot(targetMatch)}
                  hidePossibleLineups={hidePossibleLineups}
                  onOpenHomeLineup={() => push(buildLineupView(targetMatch.home_team, targetMatch.id))}
                  onOpenAwayLineup={() => push(buildLineupView(targetMatch.away_team, targetMatch.id))}
                  possibleLineupsCaption={possibleLineupsCaption}
                  possibleLineupsConfirmed={possibleLineupsConfirmed}
                  onOpenPossibleLineups={() => push(buildPossibleLineupsView(targetMatch))}
                />
              </div>
            </div>

            {error ? (
              <p className="mt-3 text-center text-sm text-[var(--tm-danger)]" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="mt-auto shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[1.38rem]">
            <PredictionDeadlineCountdown kickoffAt={targetMatch.kickoff_at} />
            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="flex-1" disabled={pending} onClick={onClose}>
                Cancelar
              </Button>
              <Button className="flex-1" disabled={!canSave || pending} onClick={onSave}>
                {pending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (view.kind === "lineup") {
      return (
        <LineupModalPanel
          teamName={view.teamName}
          matchId={view.matchId}
          onFormationResolved={setLineupFormation}
          onPlayerClick={(playerName) =>
            push({ kind: "player", teamName: view.teamName, playerName })
          }
        />
      );
    }

    if (view.kind === "player") {
      return <PlayerDetailPanel teamName={view.teamName} playerName={view.playerName} />;
    }

    if (view.kind === "mvp") {
      return (
        <MvpPickPanel
          poolId={view.poolId}
          matchId={view.matchId}
          homeTeam={view.homeTeam}
          awayTeam={view.awayTeam}
          serverEditable={view.serverEditable}
          savedPlayerName={view.savedPlayerName}
          savedTeamName={view.savedTeamName}
          savedShirtNumber={view.savedShirtNumber}
          onSaved={(playerName, teamName, shirtNumber) =>
            handleMvpSaved(view.matchId, playerName, teamName, shirtNumber)
          }
        />
      );
    }

    return (
      <PossibleLineupsPanel
        matchId={view.matchId}
        homeTeam={view.homeTeam}
        awayTeam={view.awayTeam}
        isLive={viewMatch.status === "live"}
        onTitleChange={setPossibleLineupsTitle}
        onConfirmedChange={setPossibleLineupsConfirmed}
      />
    );
  }

  const entityPanelSlide = buildPanelSlide((view) => renderPanelView(view, viewMatch));

  const teamCarouselSlide =
    atLineupCarousel && !entityPanelSlide
      ? buildTeamCarouselSlide((teamName) =>
          renderPanelView(buildLineupView(teamName, viewMatch.id), viewMatch)
        )
      : null;

  const matchPanelSlide: ModalPanelSlide | null =
    matchSlide && atPredictionRoot && !entityPanelSlide
      ? {
          direction: matchSlide.direction,
          phase: matchSlide.phase,
          incoming: renderPanelView(
            { kind: "prediction" },
            mergeMvpIntoMatch(matchSlide.target, mvpOverrides[matchSlide.target.id])
          ),
          onTransitionEnd: () => finishMatchSlideRef.current(),
        }
      : null;

  const activePanelSlide = entityPanelSlide ?? teamCarouselSlide ?? matchPanelSlide;
  const isLineupView = panelView.kind === "lineup";
  const isMvpView = panelView.kind === "mvp";
  const isPossibleLineupsView = panelView.kind === "possible-lineups";
  const isPlayerView = panelView.kind === "player";
  const isFieldView = isLineupView || isMvpView || isPossibleLineupsView;
  const isCompactModal = isFieldView || isPlayerView;
  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      title={quickPanelTitle(panelView, {
        lineupFormation,
        possibleLineupsTitle:
          panelView.kind === "possible-lineups" && isLiveMatch
            ? lineupsModalTitle({ bothConfirmed: possibleLineupsConfirmed, isLive: true })
            : possibleLineupsTitle,
        possibleLineupsConfirmed: isLiveMatch ? false : possibleLineupsConfirmed,
      })}
      hideTitle={atPredictionRoot}
      hideHeaderDivider
      ariaLabel={atPredictionRoot ? "Pronóstico del partido" : undefined}
      headerCenter={
        atPredictionRoot
          ? isLiveMatch
            ? <LiveMatchHeaderLabel size="modal" />
            : formatKickoff(viewMatch.kickoff_at)
          : undefined
      }
      headerTitleAlign={isMvpView || isPossibleLineupsView ? "left" : "default"}
      headerCompact={isCompactModal}
      scrollContent={!isCompactModal}
      className={cn(
        isMvpView && cn(MVP_MODAL_PICK_PANEL_CLASS, "max-h-[calc(100dvh-1rem)]"),
        isPossibleLineupsView &&
          cn(POSSIBLE_LINEUPS_MODAL_PANEL_CLASS, "max-h-[calc(100dvh-1rem)]"),
        isLineupView && cn(LINEUP_MODAL_PANEL_CLASS, "max-h-[calc(100dvh-1rem)]"),
        isPlayerView && cn(PLAYER_MODAL_PANEL_CLASS, "max-h-[calc(100dvh-1rem)]")
      )}
      containerClassName={isCompactModal ? "p-1.5" : undefined}
      panelHostClassName={
        isLineupView
          ? LINEUP_MODAL_PANEL_HOST_CLASS
          : isPlayerView
            ? PLAYER_MODAL_PANEL_HOST_CLASS
            : undefined
      }
      wrapperClassName={cn(
        isLineupView && LINEUP_MODAL_WRAPPER_CLASS,
        isPlayerView && PLAYER_MODAL_WRAPPER_CLASS,
        (isMvpView || isPossibleLineupsView) && MVP_MODAL_WRAPPER_CLASS
      )}
      opaque={opaque}
      onSwipeLeft={
        canSwipeMatches && atPredictionRoot && !activePanelSlide
          ? () => startMatchSlide(1)
          : canSwipeTeams && atLineupCarousel && !activePanelSlide
            ? () => startTeamSlide(1)
            : undefined
      }
      onSwipeRight={
        canSwipeMatches && atPredictionRoot && !activePanelSlide
          ? () => startMatchSlide(-1)
          : canSwipeTeams && atLineupCarousel && !activePanelSlide
            ? () => startTeamSlide(-1)
            : undefined
      }
      belowPanel={
        canSwipeMatches && atPredictionRoot ? (
          <MatchSwipeDots position={dotPosition} />
        ) : canSwipeTeams && atLineupCarousel ? (
          <CarouselSwipeDots activeIndex={teamCarouselIndex} total={matchTeams.length} />
        ) : undefined
      }
      onBack={canGoBack && !isPanelSliding && !isCarouselSliding ? pop : undefined}
      panelSlide={activePanelSlide}
      loading={pending && panelView.kind === "prediction"}
    >
      {renderPanelView(panelView, viewMatch)}
    </Modal>

    {currentProfileId ? (
      <MatchPredictionsBoardModal
        open={predictionsBoardOpen}
        onClose={() => setPredictionsBoardOpen(false)}
        poolId={poolId}
        matchId={viewMatch.id}
        homeTeam={viewMatch.home_team}
        awayTeam={viewMatch.away_team}
        currentProfileId={currentProfileId}
        carouselMatches={boardCarouselMatches}
      />
    ) : null}

    {isFinishedMatch ? (
      <MatchStatsModal
        open={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        homeTeam={viewMatch.home_team}
        awayTeam={viewMatch.away_team}
        homeGoals={viewMatch.officialHome ?? liveSnapshot?.homeScore ?? null}
        awayGoals={viewMatch.officialAway ?? liveSnapshot?.awayScore ?? null}
        stats={liveSnapshot?.stats ?? null}
      />
    ) : null}
    </>
  );
}
