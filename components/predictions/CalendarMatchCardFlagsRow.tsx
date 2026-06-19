import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import type { CalendarMatchUnderScore } from "@/lib/predictions/calendar-match-under-score";
import { cn } from "@/lib/utils";

type CalendarMatchCardFlagsRowProps = {
  homeTeam: string;
  awayTeam: string;
  centerLabel: string;
  underScore?: CalendarMatchUnderScore | null;
  centerClassName?: string;
};

/** Fila de banderas alineadas al guión del marcador; subtítulo bajo el marcador (grupo o MVP). */
export function CalendarMatchCardFlagsRow({
  homeTeam,
  awayTeam,
  centerLabel,
  underScore,
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
          {underScore ? (
            <span
              className={cn(
                "tm-cal-match-subtitle absolute left-1/2 top-full max-w-[3.5rem] -translate-x-1/2 -translate-y-0.5 truncate leading-none",
                underScore.tone === "group" &&
                  "tm-cal-match-group tm-cal-match-group--under-score uppercase font-semibold tracking-wide text-[var(--tm-accent)]",
                underScore.tone === "official-mvp" &&
                  "tm-cal-match-subtitle--official-mvp font-medium text-white",
                underScore.tone === "predicted-mvp" &&
                  "tm-cal-match-subtitle--predicted-mvp font-medium text-[var(--tm-accent)]",
              )}
            >
              {underScore.label}
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
