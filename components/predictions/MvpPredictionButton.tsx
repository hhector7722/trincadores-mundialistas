"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ConfirmedLineupCheckIcon } from "@/components/lineup/ConfirmedLineupCheckIcon";
import { MatchContextActionButton } from "@/components/lineup/MatchContextActionButton";
import { PredictionOutcomeIcon } from "@/components/predictions/PredictionOutcomeIcon";
import { isMvpPredictionCorrect } from "@/lib/predictions/prediction-outcome";
import { shirtPlayerName } from "@/lib/lineup/short-player-name";
import { cn } from "@/lib/utils";

const FINISHED_INLINE_CHECK_GAP_PX = 4;

/** Nombre centrado en el ancho de la card; el tick no desplaza el centro. */
function FinishedInlineMvpCorrect({
  savedLabel,
  className,
}: {
  savedLabel: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [checkPos, setCheckPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const update = () => {
      const label = labelRef.current;
      const container = containerRef.current;
      if (!label || !container) return;

      const labelRect = label.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setCheckPos({
        left: labelRect.right - containerRect.left + FINISHED_INLINE_CHECK_GAP_PX,
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
  }, [savedLabel]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full text-[9px] font-semibold leading-none",
        className,
      )}
    >
      <span ref={labelRef} className="block w-full truncate text-center text-white">
        {savedLabel}
      </span>
      {checkPos != null ? (
        <span
          className="absolute -translate-y-1/2"
          style={{ left: checkPos.left, top: checkPos.top }}
        >
          <ConfirmedLineupCheckIcon />
        </span>
      ) : null}
    </div>
  );
}

/** La cruz roja queda en el centro de la card; pronóstico a la izquierda y MVP oficial a la derecha. */
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
    <div
      className={cn(
        "grid w-full grid-cols-[1fr_auto_1fr] items-center gap-1 text-[9px] font-semibold leading-none",
        className,
      )}
    >
      <span className="min-w-0 truncate text-right text-[var(--tm-accent)] line-through">
        {savedLabel}
      </span>
      <PredictionOutcomeIcon variant="error" className="shrink-0 justify-self-center" />
      <span className="min-w-0 truncate text-left text-white">{officialLabel}</span>
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
      showEdit={!readOnly}
      addIcon={!compact}
      hideCaption={compact}
      emptyLabel={compact ? "Añadir MVP" : undefined}
      className={className}
    />
  );
}
