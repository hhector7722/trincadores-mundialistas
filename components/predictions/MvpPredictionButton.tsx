"use client";

import { ConfirmedLineupCheckIcon } from "@/components/lineup/ConfirmedLineupCheckIcon";
import { MatchContextActionButton } from "@/components/lineup/MatchContextActionButton";
import { PredictionOutcomeIcon } from "@/components/predictions/PredictionOutcomeIcon";
import { isMvpPredictionCorrect } from "@/lib/predictions/prediction-outcome";
import { shirtPlayerName } from "@/lib/lineup/short-player-name";
import { cn } from "@/lib/utils";

/** Nombre centrado en el ancho de la card; el tick centrado debajo. */
function FinishedInlineMvpCorrect({
  savedLabel,
  className,
}: {
  savedLabel: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center gap-0.5 text-[10px] font-semibold leading-none sm:text-xs",
        className,
      )}
    >
      <span className="block w-full truncate text-center text-white">
        {savedLabel}
      </span>
      <ConfirmedLineupCheckIcon />
    </div>
  );
}

/** Pronosticado e icono arriba; MVP oficial debajo. Ambos centrados. */
function FinishedInlineMvpIncorrect({
  savedLabel,
  officialLabel,
  className,
}: {
  savedLabel: string;
  officialLabel: string;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full flex-col items-center gap-0.5 text-[9px] font-semibold leading-none", className)}>
      <div className="flex max-w-full items-center justify-center gap-1">
        <span className="min-w-0 truncate text-[var(--tm-accent)] line-through">
          {savedLabel}
        </span>
        <PredictionOutcomeIcon variant="error" className="shrink-0" />
      </div>
      <span className="max-w-full truncate text-center text-white">
        {officialLabel}
      </span>
    </div>
  );
}

type MvpPredictionButtonProps = {
  savedPlayerName?: string | null;
  savedTeamName?: string | null;
  onClick?: () => void;
  variant?: "default" | "compact";
  className?: string;
  /** Sin lápiz ni interacción (partido en juego). */
  readOnly?: boolean;
  /** Resultado oficial al finalizar el partido. */
  officialPlayerName?: string | null;
  officialTeamName?: string | null;
  /** Partido finalizado en card compacta: MVP pronosticado y real en la misma fila. */
  finishedInline?: boolean;
  /** Muestra lápiz de edición junto al valor guardado. */
  showEdit?: boolean;
};

/** Selector o visualización del MVP pronosticado del partido. */
export function MvpPredictionButton({
  savedPlayerName,
  savedTeamName,
  onClick,
  variant = "default",
  className,
  readOnly = false,
  officialPlayerName,
  officialTeamName,
  finishedInline = false,
  showEdit = true,
}: MvpPredictionButtonProps) {
  const compact = variant === "compact";
  const savedLabel =
    savedPlayerName && compact ? shirtPlayerName(savedPlayerName) : savedPlayerName;
  const isFinished = officialPlayerName != null && officialPlayerName.trim().length > 0;
  const hasSaved = Boolean(savedPlayerName?.trim());

  if (isFinished && hasSaved) {
    const correct = isMvpPredictionCorrect(
      savedPlayerName!,
      savedTeamName ?? "",
      officialPlayerName,
      officialTeamName,
    );
    const officialLabel = compact
      ? shirtPlayerName(officialPlayerName!)
      : officialPlayerName;

    if (finishedInline && !correct) {
      return (
        <FinishedInlineMvpIncorrect
          savedLabel={savedLabel!}
          officialLabel={officialLabel!}
          className={className}
        />
      );
    }

    if (finishedInline && correct) {
      return (
        <FinishedInlineMvpCorrect savedLabel={savedLabel!} className={className} />
      );
    }

    return (
      <div className={cn("w-full min-w-0", className)}>
        {!compact ? (
          <p className="text-center text-[9px] font-semibold uppercase tracking-wider text-white/60">
            MVP
          </p>
        ) : null}

        {correct ? (
          <div
            className="flex items-center justify-center gap-1 text-[10px] font-semibold sm:text-xs"
            style={{ fontSize: compact ? undefined : "0.75rem" }}
          >
            <span className="max-w-full truncate text-center text-white">{savedLabel}</span>
            <ConfirmedLineupCheckIcon />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <div
              className="flex items-center justify-center gap-1 text-[10px] font-semibold sm:text-xs"
              style={{ fontSize: compact ? undefined : "0.75rem" }}
            >
              <span className="max-w-full truncate text-center text-[var(--tm-accent)] line-through">
                {savedLabel}
              </span>
              <PredictionOutcomeIcon variant="error" />
            </div>
            <p className="max-w-full truncate text-center text-[10px] font-semibold text-white sm:text-xs">
              {officialLabel}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (readOnly) {
    if (!hasSaved) return null;

    return (
      <div className={cn("w-full min-w-0", className)}>
        {!compact ? (
          <p className="text-center text-[9px] font-semibold uppercase tracking-wider text-white/60">
            MVP
          </p>
        ) : null}
        <p
          className={cn(
            "w-full truncate text-center text-[var(--tm-accent)]",
            compact
              ? "text-[10px] font-semibold uppercase tracking-wide"
              : "font-display text-[10px] font-semibold normal-case sm:text-xs",
          )}
        >
          {savedLabel}
        </p>
      </div>
    );
  }

  return (
    <MatchContextActionButton
      caption={compact ? "MVP" : "MVP +"}
      onClick={onClick ?? (() => {})}
      savedValue={savedLabel}
      showEdit={showEdit && !readOnly}
      addIcon
      hideCaption={compact}
      emptyLabel={compact ? "Añadir MVP" : undefined}
      emptyVariant={compact ? "pill" : "text"}
      className={className}
    />
  );
}
