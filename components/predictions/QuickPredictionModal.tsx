"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { savePrediction } from "@/actions/predictions";
import { buildLineupView, buildMvpView } from "@/components/lineup/EntityModalController";
import { LineupModalPanel } from "@/components/lineup/LineupModalPanel";
import { MatchContextActionsRow } from "@/components/lineup/MatchContextActionsRow";
import { MvpPredictionPanel } from "@/components/lineup/MvpPredictionPanel";
import { PlayerDetailPanel } from "@/components/lineup/PlayerDetailPanel";
import { entityModalTitleContent } from "@/components/lineup/EntityModalTitle";
import type { EntityModalView } from "@/components/lineup/entity-modal-types";
import { MatchTeamsDisplay } from "@/components/matches/MatchTeamsDisplay";
import { PredictionDeadlineCountdown } from "@/components/predictions/PredictionDeadlineCountdown";
import { ScoreStepper } from "@/components/predictions/ScoreStepper";
import { Button } from "@/components/ui/button";
import { Modal, type ModalPanelSlide } from "@/components/ui/modal";
import { resolvePredictionUiState } from "@/lib/predictions/edit-state";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import {
  LINEUP_MODAL_PANEL_CLASS,
  LINEUP_MODAL_PANEL_HOST_CLASS,
  LINEUP_MODAL_WRAPPER_CLASS,
  MVP_MODAL_WRAPPER_CLASS,
} from "@/lib/lineup/field-asset";
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

function quickPanelTitle(view: QuickPanelView, lineupFormation?: string): ReactNode {
  if (view.kind === "prediction") return "Pronóstico";
  return entityModalTitleContent(view, {
    lineupFormation: view.kind === "lineup" ? lineupFormation : undefined,
  });
}

export function QuickPredictionModal({
  open,
  onClose,
  poolId,
  match,
  matches,
  onMatchChange,
}: QuickPredictionModalProps) {
  const router = useRouter();
  const orderedMatches = useMemo(
    () => (matches && matches.length > 0 ? sortMatchesByKickoff(matches) : [match]),
    [match, matches]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [lineupFormation, setLineupFormation] = useState<string | undefined>();
  const [matchSlide, setMatchSlide] = useState<MatchSlideState | null>(null);
  const matchSlideLockRef = useRef(false);
  const matchSlideTimerRef = useRef<number | null>(null);
  const onMatchChangeRef = useRef(onMatchChange);
  const wasOpenRef = useRef(false);

  const viewMatch = orderedMatches[activeIndex] ?? match;
  const canSwipeMatches = orderedMatches.length > 1 && Boolean(onMatchChange);
  const dotPosition = resolveDotPosition(activeIndex, orderedMatches.length);

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
  }, [lineupTeamName, panelView.kind]);

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

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      clearMatchSlideTimer();
      matchSlideLockRef.current = false;
      setMatchSlide(null);
      return;
    }

    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      const idx = orderedMatches.findIndex((item) => item.id === match.id);
      setActiveIndex(idx >= 0 ? idx : 0);
      setMatchSlide(null);
      matchSlideLockRef.current = false;
    }
  }, [open, match.id, orderedMatches, clearMatchSlideTimer]);

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

  function renderPanelView(view: QuickPanelView, targetMatch: MatchWithPrediction) {
    if (view.kind === "prediction") {
      return (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-4 pb-0 pt-2">
            <div className="mt-2">
              <MatchTeamsDisplay
                layout="predictionModal"
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
            </div>

            <MatchContextActionsRow
              compact
              layout="teamAnchors"
              className="mt-[0.35rem] [&>div]:min-h-[2rem]"
              match={targetMatch}
              onOpenHomeLineup={() => push(buildLineupView(targetMatch.home_team, targetMatch.id))}
              onOpenAwayLineup={() => push(buildLineupView(targetMatch.away_team, targetMatch.id))}
              onOpenMvp={() => push(buildMvpView(poolId, targetMatch))}
            />

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

    return (
      <MvpPredictionPanel
        poolId={view.poolId}
        matchId={view.matchId}
        homeTeam={view.homeTeam}
        awayTeam={view.awayTeam}
        serverEditable={view.serverEditable}
        savedPlayerName={view.savedPlayerName}
        savedTeamName={view.savedTeamName}
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
          incoming: renderPanelView({ kind: "prediction" }, matchSlide.target),
          onTransitionEnd: () => finishMatchSlideRef.current(),
        }
      : null;

  const activePanelSlide = entityPanelSlide ?? teamCarouselSlide ?? matchPanelSlide;
  const isLineupView = panelView.kind === "lineup";
  const isMvpView = panelView.kind === "mvp";
  const isFieldView = isLineupView || isMvpView;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={quickPanelTitle(panelView, lineupFormation)}
      hideTitle={atPredictionRoot}
      hideHeaderDivider
      ariaLabel={atPredictionRoot ? "Pronóstico del partido" : undefined}
      headerCenter={atPredictionRoot ? formatKickoff(viewMatch.kickoff_at) : undefined}
      headerTitleAlign={isMvpView ? "left" : "default"}
      headerCompact={isFieldView}
      scrollContent={!isFieldView}
      className={cn(
        isMvpView && "max-h-[calc(100dvh-1rem)]",
        isLineupView && cn(LINEUP_MODAL_PANEL_CLASS, "max-h-[calc(100dvh-1rem)]")
      )}
      containerClassName={isFieldView ? "p-1.5" : undefined}
      panelHostClassName={isLineupView ? LINEUP_MODAL_PANEL_HOST_CLASS : undefined}
      wrapperClassName={cn(
        isLineupView && LINEUP_MODAL_WRAPPER_CLASS,
        isMvpView && MVP_MODAL_WRAPPER_CLASS
      )}
      backdropClassName="bg-[#2a1058]/40 backdrop-blur-[2px]"
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
  );
}
