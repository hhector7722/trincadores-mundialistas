import { CalendarFinishedOutcomeIcons } from "@/components/predictions/CalendarFinishedOutcomeIcons";
import { CalendarMatchCardFlagsRow } from "@/components/predictions/CalendarMatchCardFlagsRow";
import { displayGoals } from "@/lib/predictions/edit-state";
import type { CalendarFinishedCardState } from "@/lib/predictions/calendar-finished-card";
import { resolvePredictionOutcomeIcons } from "@/lib/predictions/prediction-outcome-icons";
import { cn } from "@/lib/utils";

type CalendarFinishedMatchCardVisualProps = {
  homeTeam: string;
  awayTeam: string;
  groupCode?: string | null;
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
  officialHome,
  officialAway,
  finishedState,
  className,
  interactive = false,
  title,
  onClick,
  anchorAttr,
}: CalendarFinishedMatchCardVisualProps) {
  const officialLabel = displayGoals(officialHome, officialAway);
  const outcomeIcons = resolvePredictionOutcomeIcons({
    scoreOutcome: finishedState.scoreOutcome,
    mvpCorrect: finishedState.mvpCorrect,
    hasScorePrediction: finishedState.hasPrediction,
    showMissIndicator: true,
    showSignOutcomeTicks: true,
  });

  const cardClassName = cn(
    "tm-cal-match-card relative flex min-w-0 w-full shrink-0 flex-col overflow-hidden",
    className,
  );

  const body = (
    <div className="tm-cal-match-card-body">
      <CalendarFinishedOutcomeIcons icons={outcomeIcons} />
      <CalendarMatchCardFlagsRow
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        centerLabel={officialLabel}
        groupCode={groupCode}
        centerClassName="!text-white"
      />
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
