import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { cn } from "@/lib/utils";

type CalendarMatchCardFlagsRowProps = {
  homeTeam: string;
  awayTeam: string;
  centerLabel: string;
  groupCode?: string | null;
  centerClassName?: string;
};

/** Fila de banderas alineadas al guión del marcador; la letra de grupo cuelga bajo el marcador. */
export function CalendarMatchCardFlagsRow({
  homeTeam,
  awayTeam,
  centerLabel,
  groupCode,
  centerClassName,
}: CalendarMatchCardFlagsRowProps) {
  return (
    <div className="tm-cal-flags relative w-full shrink-0">
      <div className="absolute left-[10%] top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
        <TeamFlagBadge name={homeTeam} size="cal" className="tm-cal-flag" />
      </div>

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[3] -translate-x-1/2 -translate-y-1/2">
        <span className={cn("tm-cal-prediction relative block tabular-nums leading-none", centerClassName)}>
          {centerLabel}
          {groupCode ? (
            <span className="tm-cal-match-group tm-cal-match-group--under-score absolute left-1/2 top-full -translate-x-1/2 uppercase text-[var(--tm-accent)]">
              {groupCode.toUpperCase()}
            </span>
          ) : null}
        </span>
      </div>

      <div className="absolute left-[90%] top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
        <TeamFlagBadge name={awayTeam} size="cal" className="tm-cal-flag" />
      </div>
    </div>
  );
}
