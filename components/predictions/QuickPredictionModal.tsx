"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { savePrediction } from "@/actions/predictions";
import { MatchTeamsDisplay } from "@/components/matches/MatchTeamsDisplay";
import { PredictionDeadlineCountdown } from "@/components/predictions/PredictionDeadlineCountdown";
import { ScoreStepper } from "@/components/predictions/ScoreStepper";
import { Button } from "@/components/ui/button";
import { Modal, type ModalPanelSlide } from "@/components/ui/modal";
import { resolvePredictionUiState } from "@/lib/predictions/edit-state";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
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

type SlideState = {
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

function QuickPredictionPanelBody({
  poolId,
  match,
  onClose,
}: {
  poolId: string;
  match: MatchWithPrediction;
  onClose: () => void;
}) {
  const router = useRouter();
  const savedHome = match.prediction?.home_goals ?? null;
  const savedAway = match.prediction?.away_goals ?? null;
  const [home, setHome] = useState(savedHome ?? 0);
  const [away, setAway] = useState(savedAway ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isLive = match.status === "live";

  const draftDirty = home !== (savedHome ?? 0) || away !== (savedAway ?? 0);

  const uiState = useMemo(
    () =>
      resolvePredictionUiState({
        savedHome,
        savedAway,
        draftHome: home,
        draftAway: away,
        draftDirty,
        matchStatus: match.status,
        serverEditable: match.serverEditable,
      }),
    [savedHome, savedAway, home, away, draftDirty, match.status, match.serverEditable]
  );

  const controlsDisabled = uiState === "locked" || pending;
  const canSave = uiState !== "locked" && (uiState !== "saved" || draftDirty);

  useEffect(() => {
    setHome(savedHome ?? 0);
    setAway(savedAway ?? 0);
    setError(null);
  }, [match.id, savedHome, savedAway]);

  function onSave() {
    setError(null);
    startTransition(async () => {
      const result = await savePrediction(poolId, match.id, home, away);
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

  return (
    <>
      <div className="space-y-4 px-4 py-4">
        <MatchTeamsDisplay
          homeTeam={match.home_team}
          awayTeam={match.away_team}
          kickoffAt={match.kickoff_at}
          isLive={isLive}
          groupCode={match.group_code}
          centerKickoff
        />

        {uiState === "locked" ? (
          <p className="text-center text-sm text-[var(--tm-muted)]">
            Predicción cerrada. El plazo terminó 5 minutos antes del pitido.
          </p>
        ) : (
          <>
            <PredictionDeadlineCountdown kickoffAt={match.kickoff_at} />
            <div className="flex items-center justify-center gap-2 py-1">
              <ScoreStepper
                label={match.home_team}
                value={home}
                disabled={controlsDisabled}
                onChange={setHome}
                variant="floating"
                hideLabel
              />
              <ScoreStepper
                label={match.away_team}
                value={away}
                disabled={controlsDisabled}
                onChange={setAway}
                variant="floating"
                hideLabel
              />
            </div>
          </>
        )}

        {error && (
          <p className="text-center text-sm text-[var(--tm-danger)]" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button variant="outline" className="flex-1" disabled={pending} onClick={onClose}>
          Cancelar
        </Button>
        {uiState !== "locked" && (
          <Button className="flex-1" disabled={!canSave || pending} onClick={onSave}>
            {pending ? "Guardando..." : "Guardar"}
          </Button>
        )}
      </div>
    </>
  );
}

export function QuickPredictionModal({
  open,
  onClose,
  poolId,
  match,
  matches,
  onMatchChange,
}: QuickPredictionModalProps) {
  const orderedMatches = useMemo(
    () => (matches && matches.length > 0 ? sortMatchesByKickoff(matches) : [match]),
    [match, matches]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [slide, setSlide] = useState<SlideState | null>(null);
  const slideLockRef = useRef(false);
  const slideFinishTimerRef = useRef<number | null>(null);
  const onMatchChangeRef = useRef(onMatchChange);
  const wasOpenRef = useRef(false);

  onMatchChangeRef.current = onMatchChange;

  const viewMatch = orderedMatches[activeIndex] ?? match;
  const canSwipe = orderedMatches.length > 1 && Boolean(onMatchChange);
  const dotPosition = resolveDotPosition(activeIndex, orderedMatches.length);

  const clearSlideFinishTimer = useCallback(() => {
    if (slideFinishTimerRef.current !== null) {
      window.clearTimeout(slideFinishTimerRef.current);
      slideFinishTimerRef.current = null;
    }
  }, []);

  const finishSlide = useCallback(() => {
    clearSlideFinishTimer();
    if (!slideLockRef.current) return;

    slideLockRef.current = false;

    setSlide((current) => {
      if (!current) return null;

      const nextIndex = orderedMatches.findIndex((item) => item.id === current.target.id);
      if (nextIndex >= 0) {
        setActiveIndex(nextIndex);
      }
      onMatchChangeRef.current?.(current.target);
      return null;
    });
  }, [clearSlideFinishTimer, orderedMatches]);

  const finishSlideRef = useRef(finishSlide);
  finishSlideRef.current = finishSlide;

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      clearSlideFinishTimer();
      slideLockRef.current = false;
      setSlide(null);
      return;
    }

    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      const idx = orderedMatches.findIndex((item) => item.id === match.id);
      setActiveIndex(idx >= 0 ? idx : 0);
      setSlide(null);
      slideLockRef.current = false;
    }
  }, [open, match.id, orderedMatches, clearSlideFinishTimer]);

  useEffect(() => {
    return () => clearSlideFinishTimer();
  }, [clearSlideFinishTimer]);

  const startSlide = useCallback(
    (offset: 1 | -1) => {
      if (!canSwipe || slideLockRef.current) return;

      const nextIndex = activeIndex + offset;
      if (nextIndex < 0 || nextIndex >= orderedMatches.length) return;

      const target = orderedMatches[nextIndex];
      if (!target) return;

      clearSlideFinishTimer();
      slideLockRef.current = true;

      setSlide({
        target,
        direction: offset === 1 ? "next" : "prev",
        phase: "prep",
      });

      slideFinishTimerRef.current = window.setTimeout(() => {
        finishSlideRef.current();
      }, SLIDE_MS + 80);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSlide((current) => (current ? { ...current, phase: "animate" } : current));
        });
      });
    },
    [activeIndex, canSwipe, clearSlideFinishTimer, orderedMatches]
  );

  const handleSlideTransitionEnd = useCallback(() => {
    finishSlideRef.current();
  }, []);

  const panelSlide: ModalPanelSlide | null = slide
    ? {
        direction: slide.direction,
        phase: slide.phase,
        incoming: (
          <QuickPredictionPanelBody poolId={poolId} match={slide.target} onClose={onClose} />
        ),
        onTransitionEnd: handleSlideTransitionEnd,
      }
    : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pronóstico"
      hideHeaderDivider
      backdropClassName="bg-[#2a1058]/40 backdrop-blur-[2px]"
      onSwipeLeft={canSwipe && !slide ? () => startSlide(1) : undefined}
      onSwipeRight={canSwipe && !slide ? () => startSlide(-1) : undefined}
      belowPanel={canSwipe ? <MatchSwipeDots position={dotPosition} /> : undefined}
      panelSlide={panelSlide}
    >
      <QuickPredictionPanelBody poolId={poolId} match={viewMatch} onClose={onClose} />
    </Modal>
  );
}
