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
  className?: string;
};

export function MatchContextActionsRow({
  match,
  onOpenHomeLineup,
  onOpenAwayLineup,
  onOpenMvp,
  compact = false,
  className,
}: MatchContextActionsRowProps) {
  const mvpSaved = match.mvpPrediction?.player_name ?? null;

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
