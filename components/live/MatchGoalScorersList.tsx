import { buildCardGoalScorerLines, type MatchGoalScorer } from "@/lib/live/goal-scorers";
import { cn } from "@/lib/utils";

type MatchGoalScorersListProps = {
  goals: MatchGoalScorer[];
  align?: "left" | "center" | "right";
  className?: string;
};

/** Clase compartida: color #CCFF00 del valor «Campeón» en pronósticos globales. */
export const GOAL_SCORER_TEXT_CLASS = "tm-goal-scorer-text";

export function MatchGoalScorersList({
  goals,
  align = "center",
  className,
}: MatchGoalScorersListProps) {
  const lines = buildCardGoalScorerLines(goals);
  if (!lines.length) return null;

  const alignClass =
    align === "left"
      ? "items-start text-left"
      : align === "right"
        ? "items-end text-right"
        : "items-center text-center";

  return (
    <div className={cn("flex w-full max-w-[9rem] flex-col gap-px sm:max-w-[10.5rem]", alignClass, className)}>
      {lines.map((line, index) => (
        <p
          key={`${line}-${index}`}
          className={cn(GOAL_SCORER_TEXT_CLASS, "w-full whitespace-nowrap")}
        >
          {line}
        </p>
      ))}
    </div>
  );
}
