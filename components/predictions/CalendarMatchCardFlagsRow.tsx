import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { cn } from "@/lib/utils";

type CalendarMatchCardFlagsRowProps = {
  homeTeam: string;
  awayTeam: string;
  centerLabel: string;
  centerClassName?: string;
};

/** Fila de banderas alineadas al guión del marcador. */
export function CalendarMatchCardFlagsRow({
  homeTeam,
  awayTeam,
  centerLabel,
  centerClassName,
}: CalendarMatchCardFlagsRowProps) {
  return (
    <div className="tm-cal-flags relative w-full shrink-0">
      <div className="absolute left-[10%] top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
        <TeamFlagBadge name={homeTeam} size="cal" className="tm-cal-flag" />
      </div>

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[3] -translate-x-1/2 -translate-y-1/2">
        <span className={cn("tm-cal-prediction block tabular-nums leading-none", centerClassName)}>
          {centerLabel}
        </span>
      </div>

      <div className="absolute left-[90%] top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
        <TeamFlagBadge name={awayTeam} size="cal" className="tm-cal-flag" />
      </div>
    </div>
  );
}
