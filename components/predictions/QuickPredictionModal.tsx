"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { savePrediction } from "@/actions/predictions";
import { buildLineupView, buildMvpView } from "@/components/lineup/EntityModalController";
import { LineupModalPanel } from "@/components/lineup/LineupModalPanel";
import { MatchContextActionsRow } from "@/components/lineup/MatchContextActionsRow";
import { MvpPredictionPanel } from "@/components/lineup/MvpPredictionPanel";
import { PlayerDetailPanel } from "@/components/lineup/PlayerDetailPanel";
import {
  entityModalTitle,
  type EntityModalView,
} from "@/components/lineup/entity-modal-types";
import { MatchTeamsDisplay } from "@/components/matches/MatchTeamsDisplay";
import { PredictionDeadlineCountdown } from "@/components/predictions/PredictionDeadlineCountdown";
import { ScoreStepper } from "@/components/predictions/ScoreStepper";
import { Button } from "@/components/ui/button";
import { Modal, type ModalPanelSlide } from "@/components/ui/modal";
import { resolvePredictionUiState } from "@/lib/predictions/edit-state";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import { usePanelSlideStack } from "@/lib/ui/use-panel-slide-stack";
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

function quickPanelTitle(view: QuickPanelView): string {
  if (view.kind === "prediction") return "Pronóstico";
  return entityModalTitle(view);
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
    isSliding: isPanelSliding,
    buildPanelSlide,
  } = usePanelSlideStack<QuickPanelView>({ kind: "prediction" });

  const atPredictionRoot = panelView.kind === "prediction";

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
        <>
          <div className="space-y-4 px-4 py-4">
            <MatchTeamsDisplay
              homeTeam={targetMatch.home_team}
              awayTeam={targetMatch.away_team}
              kickoffAt={targetMatch.kickoff_at}
              isLive={targetMatch.status === "live"}
              groupCode={targetMatch.group_code}
              centerKickoff
            />

            {uiState === "locked" ? (
              <p className="text-center text-sm text-[var(--tm-muted)]">
                Predicción cerrada. El plazo terminó 5 minutos antes del pitido.
              </p>
            ) : (
              <>
                <PredictionDeadlineCountdown kickoffAt={targetMatch.kickoff_at} />
                <div className="flex items-center justify-center gap-2 py-1">
                  <ScoreStepper
                    label={targetMatch.home_team}
                    value={home}
                    disabled={controlsDisabled}
                    onChange={setHome}
                    variant="floating"
                    hideLabel
                  />
                  <ScoreStepper
                    label={targetMatch.away_team}
                    value={away}
                    disabled={controlsDisabled}
                    onChange={setAway}
                    variant="floating"
                    hideLabel
                  />
                </div>
              </>
            )}

            <MatchContextActionsRow
              match={targetMatch}
              onOpenHomeLineup={() => push(buildLineupView(targetMatch.home_team))}
              onOpenAwayLineup={() => push(buildLineupView(targetMatch.away_team))}
              onOpenMvp={() => push(buildMvpView(poolId, targetMatch))}
            />

            {error ? (
              <p className="text-center text-sm text-[var(--tm-danger)]" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button variant="outline" className="flex-1" disabled={pending} onClick={onClose}>
              Cancelar
            </Button>
            {uiState !== "locked" ? (
              <Button className="flex-1" disabled={!canSave || pending} onClick={onSave}>
                {pending ? "Guardando..." : "Guardar"}
              </Button>
            ) : null}
          </div>
        </>
      );
    }

    if (view.kind === "lineup") {
      return (
        <LineupModalPanel
          teamName={view.teamName}
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

  const matchPanelSlide: ModalPanelSlide | null =
    matchSlide && atPredictionRoot && !entityPanelSlide
      ? {
          direction: matchSlide.direction,
          phase: matchSlide.phase,
          incoming: renderPanelView({ kind: "prediction" }, matchSlide.target),
          onTransitionEnd: () => finishMatchSlideRef.current(),
        }
      : null;

  const activePanelSlide = entityPanelSlide ?? matchPanelSlide;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={quickPanelTitle(panelView)}
      hideHeaderDivider
      backdropClassName="bg-[#2a1058]/40 backdrop-blur-[2px]"
      onSwipeLeft={
        canSwipeMatches && atPredictionRoot && !activePanelSlide ? () => startMatchSlide(1) : undefined
      }
      onSwipeRight={
        canSwipeMatches && atPredictionRoot && !activePanelSlide ? () => startMatchSlide(-1) : undefined
      }
      belowPanel={
        canSwipeMatches && atPredictionRoot ? <MatchSwipeDots position={dotPosition} /> : undefined
      }
      onBack={canGoBack && !isPanelSliding ? pop : undefined}
      panelSlide={activePanelSlide}
      loading={pending && panelView.kind === "prediction"}
    >
      {renderPanelView(panelView, viewMatch)}
    </Modal>
  );
}
