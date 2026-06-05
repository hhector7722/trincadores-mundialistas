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

type QuickPredictionModalProps = {
  open: boolean;
  onClose: () => void;
  poolId: string;
  match: MatchWithPrediction;
};

export function QuickPredictionModal({
  open,
  onClose,
  poolId,
  match,
}: QuickPredictionModalProps) {
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
    if (!open) return;
    setHome(savedHome ?? 0);
    setAway(savedAway ?? 0);
    setError(null);
  }, [open, savedHome, savedAway]);

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
    <Modal open={open} onClose={onClose} title="Pronóstico" hideHeaderDivider>
      <div className="space-y-4 px-4 py-4">
        <MatchTeamsDisplay
          homeTeam={match.home_team}
          awayTeam={match.away_team}
          kickoffAt={match.kickoff_at}
          isLive={isLive}
          centerKickoff
        />

        {uiState === "locked" ? (
          <p className="text-center text-sm text-[var(--tm-muted)]">
            Predicción cerrada. El plazo terminó 5 minutos antes del pitido.
          </p>
        ) : (
          <>
            <PredictionDeadlineCountdown kickoffAt={match.kickoff_at} />
            <div className="flex items-center justify-center gap-4 py-1">
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

      <div className="flex shrink-0 gap-2 bg-[var(--tm-surface)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
