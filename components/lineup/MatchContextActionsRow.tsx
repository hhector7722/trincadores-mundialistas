"use client";

import { MatchContextActionButton } from "@/components/lineup/MatchContextActionButton";
import { MvpPredictionButton } from "@/components/predictions/MvpPredictionButton";
import type { MatchWithPrediction } from "@/lib/predictions/queries";

type MatchContextActionsRowProps = {
  match: MatchWithPrediction;
  onOpenHomeLineup: () => void;
  onOpenAwayLineup: () => void;
  onOpenMvp: () => void;
  /** Sin etiquetas grises ni borde superior; MVP con patrón edición compacto. */
  compact?: boolean;
  /** Alineado a anclas de equipo / centro / equipo (modal, card inicio…). */
  layout?: "grid" | "teamAnchors";
  /** Oculta MVP en fila de acciones (p. ej. MVP va en fila intermedia del modal). */
  hideMvp?: boolean;
  /** Ancla horizontal de alineación local (debe coincidir con `MatchTeamsDisplay`). */
  homeAnchor?: string;
  /** Ancla horizontal de alineación visitante. */
  awayAnchor?: string;
  /** MVP resuelto (p. ej. leído de `match_mvp_predictions` en el modal). */
  mvpPlayerName?: string | null;
  className?: string;
};

export function MatchContextActionsRow({
  match,
  onOpenHomeLineup,
  onOpenAwayLineup,
  onOpenMvp,
  compact = false,
  layout = "grid",
  hideMvp = false,
  homeAnchor = "10%",
  awayAnchor = "90%",
  mvpPlayerName,
  className,
}: MatchContextActionsRowProps) {
  const mvpSaved = mvpPlayerName?.trim() || match.mvpPrediction?.player_name?.trim() || null;

  if (layout === "teamAnchors") {
    return (
      <div className={className}>
        <div className="relative min-h-[2.75rem] w-full">
          <div
            className="absolute top-0 w-max max-w-[38%] -translate-x-1/2"
            style={{ left: homeAnchor }}
          >
            <MatchContextActionButton
              caption="Alineación"
              hideCaption={compact}
              onClick={onOpenHomeLineup}
            />
          </div>
          {!hideMvp ? (
            <div className="absolute left-1/2 top-0 z-[2] -translate-x-1/2">
              <div className="inline-block min-w-[4.5rem] max-w-[min(42vw,9.5rem)]">
                <MvpPredictionButton
                  savedPlayerName={mvpSaved}
                  onClick={onOpenMvp}
                  variant={compact ? "compact" : "default"}
                />
              </div>
            </div>
          ) : null}
          <div
            className="absolute top-0 w-max max-w-[38%] -translate-x-1/2"
            style={{ left: awayAnchor }}
          >
            <MatchContextActionButton
              caption="Alineación"
              hideCaption={compact}
              onClick={onOpenAwayLineup}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative grid min-h-[2.75rem] grid-cols-3 items-start">
        <div className="flex justify-center px-1">
          <MatchContextActionButton
            caption="Alineación"
            hideCaption={compact}
            onClick={onOpenHomeLineup}
          />
        </div>
        <div className="flex justify-center px-1">
          <MvpPredictionButton
            savedPlayerName={mvpSaved}
            onClick={onOpenMvp}
            variant={compact ? "compact" : "default"}
          />
        </div>
        <div className="flex justify-center px-1">
          <MatchContextActionButton
            caption="Alineación"
            hideCaption={compact}
            onClick={onOpenAwayLineup}
          />
        </div>
      </div>
    </div>
  );
}
