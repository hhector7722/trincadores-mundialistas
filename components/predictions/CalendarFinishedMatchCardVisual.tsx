import { PredictionOutcomeIcon } from "@/components/predictions/PredictionOutcomeIcon";
import { CalendarMatchCardFlagsRow } from "@/components/predictions/CalendarMatchCardFlagsRow";
import { PredictionStatusBadge } from "@/components/predictions/PredictionStatusBadge";
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

  const cardClassName = cn(
    "tm-cal-match-card relative flex min-w-0 w-full shrink-0 flex-col overflow-hidden",
    className,
  );

  const body = (
    <>
      <PredictionStatusBadge outcome={finishedState.scoreOutcome} />

      {finishedState.mvpCorrect ? (
        <PredictionOutcomeIcon
          variant="mvp"
          className="pointer-events-none absolute right-0 top-0 z-[3]"
        />
      ) : null}

      <div className="tm-cal-match-card-body">
        {finishedState.hasPrediction ? (
          <span className="tm-cal-kickoff shrink-0 text-center font-medium leading-none !text-[#facc15]">
            {predictionLabel}
          </span>
        ) : (
          <span className="tm-cal-kickoff shrink-0 text-center font-medium leading-none !text-[#facc15]" aria-hidden>
            {" "}
          </span>
        )}

        <CalendarMatchCardFlagsRow
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          centerLabel={officialLabel}
          groupCode={groupCode}
          centerClassName="!text-white"
        />
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
