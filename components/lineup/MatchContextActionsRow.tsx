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
  /** Alineado a anclas 10% / 50% / 90% (modal de pronóstico). */
  layout?: "grid" | "teamAnchors";
  className?: string;
};

export function MatchContextActionsRow({
  match,
  onOpenHomeLineup,
  onOpenAwayLineup,
  onOpenMvp,
  compact = false,
  layout = "grid",
  className,
}: MatchContextActionsRowProps) {
  const mvpSaved = match.mvpPrediction?.player_name ?? null;

  if (layout === "teamAnchors") {
    return (
      <div className={className}>
        <div className="relative min-h-[2.75rem] w-full">
          <div className="absolute left-[10%] top-0 w-max max-w-[38%] -translate-x-1/2">
            <MatchContextActionButton
              caption="Alineación"
              hideCaption={compact}
              onClick={onOpenHomeLineup}
            />
          </div>
          <div className="absolute left-1/2 top-0 w-max max-w-[40%] -translate-x-1/2">
            <MvpPredictionButton
              savedPlayerName={mvpSaved}
              onClick={onOpenMvp}
              variant={compact ? "compact" : "default"}
            />
          </div>
          <div className="absolute left-[90%] top-0 w-max max-w-[38%] -translate-x-1/2">
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
