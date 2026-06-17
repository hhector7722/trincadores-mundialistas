import type { ReactNode } from "react";
import { PredictionOutcomeIcon } from "@/components/predictions/PredictionOutcomeIcon";
import { cn } from "@/lib/utils";

function LegendItem({ icons, label }: { icons: ReactNode; label: string }) {
  return (
    <li className="inline-flex items-center gap-1">
      <span>{label}</span>
      <span className="inline-flex shrink-0 items-center gap-0.5" aria-hidden>
        {icons}
      </span>
    </li>
  );
}

/** Leyenda compacta de iconos de acierto en partidos finalizados. */
export function MatchPredictionsBoardLegend({ className }: { className?: string }) {
  return (
    <div className={cn("shrink-0 px-3", className)}>
      <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[10px] leading-tight text-[var(--tm-muted)]">
        <LegendItem
          icons={
            <span
              className="inline-block h-3 w-1 rounded-full bg-[var(--tm-cal-outcome-sign)]"
              aria-hidden
            />
          }
          label="Signo 1 x 2"
        />
        <LegendItem
          icons={
            <>
              <PredictionOutcomeIcon variant="success" className="text-[10px]" />
              <PredictionOutcomeIcon variant="success" className="text-[10px]" />
            </>
          }
          label="Marcador exacto"
        />
        <LegendItem icons={<PredictionOutcomeIcon variant="mvp" />} label="MVP" />
      </ul>
    </div>
  );
}
