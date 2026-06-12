import { PredictionOutcomeIcon } from "@/components/predictions/PredictionOutcomeIcon";
import { PredictionStatusBadge } from "@/components/predictions/PredictionStatusBadge";
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
  const showTopRow = Boolean(
    groupCode || finishedState.hasPrediction || finishedState.mvpCorrect,
  );

  const cardClassName = cn(
    "tm-cal-match-card relative flex min-w-0 w-full shrink-0 flex-col overflow-hidden",
    className,
  );

  const body = (
    <div className="tm-cal-match-card-body">
      {showTopRow ? (
        <div className="tm-cal-finished-meta-row relative flex min-h-[1em] shrink-0 items-center gap-0.5 px-0.5">
          {groupCode ? (
            <span className="tm-cal-match-group pointer-events-none z-[3] shrink-0 uppercase leading-none text-[var(--tm-accent)]">
              {groupCode.toUpperCase()}
            </span>
          ) : null}

          {finishedState.hasPrediction ? (
            <span className="tm-cal-kickoff min-w-0 flex-1 text-center font-medium leading-none text-white">
              {predictionLabel}
            </span>
          ) : (
            <span className="min-w-0 flex-1" aria-hidden />
          )}

          {finishedState.mvpCorrect ? (
            <PredictionOutcomeIcon variant="mvp" className="relative z-[3] shrink-0" />
          ) : null}
        </div>
      ) : null}

      <div className="tm-cal-flags relative w-full shrink-0">
        <PredictionStatusBadge outcome={finishedState.scoreOutcome} />

        <div className="absolute left-[10%] top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
          <TeamFlagBadge name={homeTeam} size="cal" className="tm-cal-flag" />
        </div>
        <span className="tm-cal-prediction pointer-events-none absolute left-1/2 top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 tabular-nums">
          {officialLabel}
        </span>
        <div className="absolute left-[90%] top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
          <TeamFlagBadge name={awayTeam} size="cal" className="tm-cal-flag" />
        </div>
      </div>
    </div>
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
