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

/** Fila de banderas alineadas al guión del marcador; MVP anclado al borde inferior de la card. */
export function CalendarMatchCardFlagsRow({
  homeTeam,
  awayTeam,
  centerLabel,
  underScore,
  centerClassName,
}: CalendarMatchCardFlagsRowProps) {
  return (
    <>
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

      {underScore ? (
        <span
          className={cn(
            "tm-cal-match-mvp-line pointer-events-none absolute inset-x-0 z-[5] truncate text-center leading-none",
            underScore.tone === "official-mvp" &&
              "tm-cal-match-subtitle tm-cal-match-subtitle--official-mvp font-medium text-white",
            underScore.tone === "predicted-mvp" &&
              "tm-cal-match-subtitle tm-cal-match-subtitle--predicted-mvp font-medium text-[var(--tm-accent)]",
          )}
        >
          {underScore.label}
        </span>
      ) : null}
    </>
  );
}
