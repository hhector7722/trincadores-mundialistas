"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { savePrediction } from "@/actions/predictions";
import { ScoreStepper } from "@/components/predictions/ScoreStepper";
import { PredictionStatusBadge } from "@/components/predictions/PredictionStatusBadge";
import { Button } from "@/components/ui/button";
import {
  displayGoals,
  resolvePredictionUiState,
  type PredictionUiState,
} from "@/lib/predictions/edit-state";
import type { MatchDetail } from "@/lib/predictions/queries";
import { formatKickoff } from "@/lib/pool/format-kickoff";
import { cn } from "@/lib/utils";

export function PredictionForm({
  poolId,
  match,
}: {
  poolId: string;
  match: MatchDetail;
}) {
  const router = useRouter();
  const savedHome = match.prediction?.home_goals ?? null;
  const savedAway = match.prediction?.away_goals ?? null;
  const [home, setHome] = useState(savedHome ?? 0);
  const [away, setAway] = useState(savedAway ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const draftDirty =
    home !== (savedHome ?? 0) || away !== (savedAway ?? 0);

  const uiState: PredictionUiState = useMemo(
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
      router.refresh();
    });
  }

  const points = match.prediction?.points_awarded;
  const pointsLabel =
    points !== null && points !== undefined && points > 0
      ? "+" + String(points) + " pts"
      : " ";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          {match.matchday_name && (
            <p className="text-xs text-[var(--tm-muted)]">{match.matchday_name}</p>
          )}
          <h1 className="text-lg font-semibold text-[var(--tm-fg)]">
            {match.home_team} — {match.away_team}
          </h1>
          <p className="mt-1 text-sm text-[var(--tm-subtle)]">{formatKickoff(match.kickoff_at)}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <PredictionStatusBadge state={uiState} />
          {match.hasOfficialResult && (
            <p className="text-xs text-[var(--tm-muted)]">
              Resultado oficial: {displayGoals(match.officialHome ?? 0, match.officialAway ?? 0)}
            </p>
          )}
        </div>

        {uiState === "locked" && (
          <p className="text-sm text-[var(--tm-muted)]">
            Prediccion cerrada. El plazo termina 5 minutos antes del pitido.
          </p>
        )}

        {uiState !== "locked" && match.serverEditable && (
          <p className="text-sm text-[var(--tm-muted)]">
            Puedes editar hasta 5 minutos antes del pitido.
          </p>
        )}

        <div className="flex items-stretch justify-center gap-4 py-2">
          <ScoreStepper
            label="Local"
            value={home}
            disabled={controlsDisabled}
            onChange={setHome}
          />
          <span className="self-center pt-6 text-lg text-[var(--tm-muted)]">:</span>
          <ScoreStepper
            label="Visitante"
            value={away}
            disabled={controlsDisabled}
            onChange={setAway}
          />
        </div>

        {uiState === "saved" && !draftDirty && savedHome !== null && savedAway !== null && (
          <p className="text-center text-sm text-[var(--tm-fg)]">
            Guardado: {displayGoals(savedHome, savedAway)}
          </p>
        )}

        {points !== null && points !== undefined && match.hasOfficialResult && (
          <p className="text-center font-display text-2xl text-[var(--tm-primary)]">{pointsLabel}</p>
        )}

        {error && (
          <p className="text-sm text-[var(--tm-danger)]" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--tm-border)] bg-[var(--tm-surface)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button
          type="button"
          disabled={controlsDisabled || (uiState === "saved" && !draftDirty)}
          className={cn("w-full", pending && "opacity-60")}
          onClick={onSave}
        >
          {pending ? "Guardando..." : "Guardar prediccion"}
        </Button>
      </div>
    </div>
  );
}