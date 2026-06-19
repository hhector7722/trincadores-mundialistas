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

/** Fila de banderas con marcador; grupo bajo el marcador o MVP entre resultado y borde inferior. */
export function CalendarMatchCardFlagsRow({
  homeTeam,
  awayTeam,
  centerLabel,
  underScore,
  centerClassName,
}: CalendarMatchCardFlagsRowProps) {
  const groupSubtitle = underScore?.tone === "group" ? underScore : null;
  const mvpSubtitle =
    underScore && underScore.tone !== "group" ? underScore : null;

  return (
    <div className="tm-cal-flags-stack w-full min-w-0 shrink-0">
      <div className="tm-cal-flags relative w-full shrink-0">
        <div className="absolute left-[10%] top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
          <TeamFlagBadge name={homeTeam} size="cal" className="tm-cal-flag" />
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[3] -translate-x-1/2 -translate-y-1/2">
          <span className={cn("tm-cal-prediction relative block tabular-nums leading-none", centerClassName)}>
            {centerLabel}
            {groupSubtitle ? (
              <span className="tm-cal-match-group tm-cal-match-group--under-score absolute left-1/2 top-full -translate-x-1/2 -translate-y-0.5 uppercase font-semibold tracking-wide text-[var(--tm-accent)]">
                {groupSubtitle.label}
              </span>
            ) : null}
          </span>
        </div>

        <div className="absolute left-[90%] top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
          <TeamFlagBadge name={awayTeam} size="cal" className="tm-cal-flag" />
        </div>
      </div>

      {mvpSubtitle ? (
        <span
          className={cn(
            "tm-cal-match-mvp-line block w-full truncate text-center leading-none",
            mvpSubtitle.tone === "official-mvp" &&
              "tm-cal-match-subtitle tm-cal-match-subtitle--official-mvp font-medium text-white",
            mvpSubtitle.tone === "predicted-mvp" &&
              "tm-cal-match-subtitle tm-cal-match-subtitle--predicted-mvp font-medium text-[var(--tm-accent)]",
          )}
        >
          {mvpSubtitle.label}
        </span>
      ) : null}
    </div>
  );
}
