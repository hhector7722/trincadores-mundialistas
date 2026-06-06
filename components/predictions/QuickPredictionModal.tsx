"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { savePrediction } from "@/actions/predictions";
import { MatchTeamsDisplay } from "@/components/matches/MatchTeamsDisplay";
import { PredictionDeadlineCountdown } from "@/components/predictions/PredictionDeadlineCountdown";
import { ScoreStepper } from "@/components/predictions/ScoreStepper";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
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
    <div
      className="flex items-center justify-center gap-1.5"
      aria-hidden="true"
    >
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

export function QuickPredictionModal({
  open,
  onClose,
  poolId,
  match,
  matches,
  onMatchChange,
}: QuickPredictionModalProps) {
  const router = useRouter();
  const savedHome = match.prediction?.home_goals ?? null;
  const savedAway = match.prediction?.away_goals ?? null;
  const [home, setHome] = useState(savedHome ?? 0);
  const [away, setAway] = useState(savedAway ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isLive = match.status === "live";

  const orderedMatches = useMemo(
    () => (matches && matches.length > 0 ? sortMatchesByKickoff(matches) : [match]),
    [match, matches]
  );

  const currentIndex = useMemo(
    () => orderedMatches.findIndex((item) => item.id === match.id),
    [orderedMatches, match.id]
  );

  const canSwipe = orderedMatches.length > 1 && Boolean(onMatchChange);
  const dotPosition = resolveDotPosition(
    currentIndex >= 0 ? currentIndex : 0,
    orderedMatches.length
  );

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
    if (!open) return;
    setHome(savedHome ?? 0);
    setAway(savedAway ?? 0);
    setError(null);
  }, [open, match.id, savedHome, savedAway]);

  function goToMatch(offset: number) {
    if (!canSwipe || currentIndex < 0) return;

    const nextIndex = currentIndex + offset;
    if (nextIndex < 0 || nextIndex >= orderedMatches.length) return;

    onMatchChange?.(orderedMatches[nextIndex]!);
  }

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
    <Modal
      open={open}
      onClose={onClose}
      title="Pronóstico"
      hideHeaderDivider
      backdropClassName="bg-[#2a1058]/40 backdrop-blur-[2px]"
      onSwipeLeft={canSwipe ? () => goToMatch(1) : undefined}
      onSwipeRight={canSwipe ? () => goToMatch(-1) : undefined}
      belowPanel={canSwipe ? <MatchSwipeDots position={dotPosition} /> : undefined}
    >
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
    </Modal>
  );
}
