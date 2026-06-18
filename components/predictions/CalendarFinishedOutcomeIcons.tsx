import { PredictionOutcomeIcon } from "@/components/predictions/PredictionOutcomeIcon";
import type { PredictionOutcomeIconVariant } from "@/lib/predictions/prediction-outcome-icons";
import { cn } from "@/lib/utils";

type CalendarFinishedOutcomeIconsProps = {
  icons: PredictionOutcomeIconVariant[];
  className?: string;
};

/** Altura unificada: discos (tick/cruz) y estrella comparten el mismo tamaño en calendario. */
const CALENDAR_OUTCOME_ICON_CLASS = "h-[10px] w-[10px] shrink-0 !min-h-0 !min-w-0";

/** Conjunto de iconos de acierto centrado en la card del calendario (partidos finalizados). */
export function CalendarFinishedOutcomeIcons({
  icons,
  className,
}: CalendarFinishedOutcomeIconsProps) {
  return (
    <div
      className={cn(
        "tm-cal-finished-outcome-slot relative h-3 w-full shrink-0",
        className,
      )}
      aria-hidden={icons.length === 0}
    >
      {icons.length > 0 ? (
        <span className="pointer-events-none absolute inset-x-0 top-[4px] z-[3] flex items-center justify-center gap-0.5">
          {icons.map((variant, index) => (
            <PredictionOutcomeIcon
              key={`${variant}-${index}`}
              variant={variant}
              className={CALENDAR_OUTCOME_ICON_CLASS}
            />
          ))}
        </span>
      ) : null}
    </div>
  );
}
