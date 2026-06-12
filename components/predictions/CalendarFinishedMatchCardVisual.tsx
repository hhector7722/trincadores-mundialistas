import { CalendarGroupRowBadge } from "@/components/predictions/CalendarGroupRowBadge";
import { PredictionOutcomeIcon } from "@/components/predictions/PredictionOutcomeIcon";
import {
  calendarMatchCardBodyClass,
  PredictionStatusBadge,
} from "@/components/predictions/PredictionStatusBadge";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { displayGoals } from "@/lib/predictions/edit-state";
import type { CalendarFinishedCardState } from "@/lib/predictions/calendar-finished-card";
import { cn } from "@/lib/utils";

type CalendarFinishedMatchCardVisualProps = {
  homeTeam: string;
  awayTeam: string;
  groupCode?: string | null;
  predictionHome: number;
  predictionAway: number;
  officialHome: number;
  officialAway: number;
  finishedState: CalendarFinishedCardState;
  className?: string;
  interactive?: boolean;
  title?: string;
  onClick?: () => void;
  anchorAttr?: Record<string, string>;
};

export function CalendarFinishedMatchCardVisual({
  homeTeam,
  awayTeam,
  groupCode,
  predictionHome,
  predictionAway,
  officialHome,
  officialAway,
  finishedState,
  className,
  interactive = false,
  title,
  onClick,
  anchorAttr,
}: CalendarFinishedMatchCardVisualProps) {
  const predictionLabel = displayGoals(predictionHome, predictionAway);
  const officialLabel = displayGoals(officialHome, officialAway);
  const kickoffSlotLabel = finishedState.showPredictedInKickoffSlot ? predictionLabel : null;

  const cardClassName = cn(
    "tm-cal-match-card relative flex min-w-0 w-full shrink-0 flex-col overflow-hidden",
    className,
  );

  const body = (
    <>
      <CalendarGroupRowBadge groupCode={groupCode} />

      <div className={calendarMatchCardBodyClass}>
        <PredictionStatusBadge outcome={finishedState.scoreOutcome} />

        {finishedState.mvpCorrect ? <PredictionOutcomeIcon variant="mvp" /> : null}

        {kickoffSlotLabel ? (
          <span className="tm-cal-kickoff shrink-0 text-center font-medium leading-none text-[var(--tm-accent)]">
            {kickoffSlotLabel}
          </span>
        ) : null}

        <div className="tm-cal-flags relative w-full shrink-0">
          <div className="absolute left-[10%] top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
            <TeamFlagBadge name={homeTeam} size="cal" className="tm-cal-flag" />
          </div>
          <span className="tm-cal-prediction pointer-events-none absolute left-1/2 top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 tabular-nums text-white">
            {officialLabel}
          </span>
          <div className="absolute left-[90%] top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
            <TeamFlagBadge name={awayTeam} size="cal" className="tm-cal-flag" />
          </div>
        </div>
      </div>
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        title={title}
        aria-label={title}
        onClick={onClick}
        {...(anchorAttr ?? {})}
        className={cardClassName}
      >
        {body}
      </button>
    );
  }

  return <div className={cardClassName}>{body}</div>;
}
