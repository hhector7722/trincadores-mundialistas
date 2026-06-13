import { formatGoalScorerLabel, type MatchGoalScorer } from "@/lib/live/goal-scorers";
import { cn } from "@/lib/utils";

type MatchGoalScorersListProps = {
  goals: MatchGoalScorer[];
  align?: "left" | "center" | "right";
  className?: string;
};

/** Mismo color que el valor de «Campeón» en pronósticos globales. */
const GOAL_SCORER_TEXT_CLASS =
  "text-[8px] font-normal leading-tight text-[#CCFF00]";

export function MatchGoalScorersList({
  goals,
  align = "center",
  className,
}: MatchGoalScorersListProps) {
  if (!goals.length) return null;

  const alignClass =
    align === "left"
      ? "items-start text-left"
      : align === "right"
        ? "items-end text-right"
        : "items-center text-center";

  return (
    <div className={cn("flex w-full max-w-[5.5rem] flex-col gap-px sm:max-w-[6.5rem]", alignClass, className)}>
      {goals.map((goal, index) => (
        <p
          key={`${goal.playerName}-${goal.minute ?? "na"}-${index}`}
          className={cn(GOAL_SCORER_TEXT_CLASS, "w-full whitespace-nowrap")}
        >
          {formatGoalScorerLabel(goal)}
        </p>
      ))}
    </div>
  );
}
