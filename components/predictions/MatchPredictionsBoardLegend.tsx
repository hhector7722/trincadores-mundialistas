import type { ReactNode } from "react";
import { PredictionOutcomeIcon } from "@/components/predictions/PredictionOutcomeIcon";

function LegendItem({ icons, label }: { icons: ReactNode; label: string }) {
  return (
    <li className="inline-flex items-center gap-1">
      <span className="inline-flex shrink-0 items-center gap-0.5" aria-hidden>
        {icons}
      </span>
      <span>{label}</span>
    </li>
  );
}

/** Leyenda compacta de iconos de acierto en partidos finalizados. */
export function MatchPredictionsBoardLegend() {
  return (
    <div className="shrink-0 border-b border-[var(--tm-border)] px-3 pb-2 pt-0.5">
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] leading-tight text-[var(--tm-muted)]">
        <LegendItem
          icons={<PredictionOutcomeIcon variant="success" className="text-[10px]" />}
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
