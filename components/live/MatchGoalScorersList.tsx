import { formatGoalScorerLabel, type MatchGoalScorer } from "@/lib/live/goal-scorers";
import { cn } from "@/lib/utils";

type MatchGoalScorersListProps = {
  goals: MatchGoalScorer[];
  align?: "left" | "center" | "right";
  /** `card` = acento lima bajo selección; `muted` = texto secundario en cabeceras de modal. */
  tone?: "card" | "muted";
  className?: string;
};

export function MatchGoalScorersList({
  goals,
  align = "center",
  tone = "card",
  className,
}: MatchGoalScorersListProps) {
  if (!goals.length) return null;

  const alignClass =
    align === "left"
      ? "items-start text-left"
      : align === "right"
        ? "items-end text-right"
        : "items-center text-center";

  const textClass =
    tone === "muted"
      ? "text-[8px] font-normal leading-tight text-white/55"
      : "text-[8px] font-normal leading-tight text-[var(--tm-accent)]";

  return (
    <div className={cn("flex w-full max-w-[5.5rem] flex-col gap-px sm:max-w-[6.5rem]", alignClass, className)}>
      {goals.map((goal, index) => (
        <p
          key={`${goal.playerName}-${goal.minute ?? "na"}-${index}`}
          className={cn(textClass, "w-full whitespace-nowrap")}
        >
          {formatGoalScorerLabel(goal)}
        </p>
      ))}
    </div>
  );
}
