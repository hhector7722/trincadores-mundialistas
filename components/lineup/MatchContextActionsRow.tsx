"use client";

import { MatchContextActionButton } from "@/components/lineup/MatchContextActionButton";
import type { MatchWithPrediction } from "@/lib/predictions/queries";

type MatchContextActionsRowProps = {
  match: MatchWithPrediction;
  onOpenHomeLineup: () => void;
  onOpenAwayLineup: () => void;
  onOpenMvp: () => void;
  className?: string;
};

export function MatchContextActionsRow({
  match,
  onOpenHomeLineup,
  onOpenAwayLineup,
  onOpenMvp,
  className,
}: MatchContextActionsRowProps) {
  const mvpSaved = match.mvpPrediction?.player_name ?? null;

  return (
    <div className={className}>
      <div className="relative grid min-h-[2.75rem] grid-cols-3 items-start">
        <div className="flex justify-center px-1">
          <MatchContextActionButton caption="Alineación" onClick={onOpenHomeLineup} />
        </div>
        <div className="flex justify-center px-1">
          <MatchContextActionButton
            caption="MVP +"
            onClick={onOpenMvp}
            savedValue={mvpSaved}
            showEdit
            addIcon
          />
        </div>
        <div className="flex justify-center px-1">
          <MatchContextActionButton caption="Alineación" onClick={onOpenAwayLineup} />
        </div>
      </div>
    </div>
  );
}
