import { PredictionStatusBadge } from "@/components/predictions/PredictionStatusBadge";
import { formatListScore } from "@/lib/predictions/edit-state";
import { resolveScoreOutcome } from "@/lib/predictions/prediction-outcome";
import { cn } from "@/lib/utils";

type FinishedMatchScoreRowProps = {
  homeGoals: number;
  awayGoals: number;
  predictedHome: number | null;
  predictedAway: number | null;
  /** `modal` = text-2xl en 34/66; `card` = grande en 15/85 como marcador live. */
  variant?: "modal" | "card";
  className?: string;
};

function formatGoal(value: number): string {
  return String(value);
}

export function FinishedMatchScoreRow({
  homeGoals,
  awayGoals,
  predictedHome,
  predictedAway,
  variant = "modal",
  className,
}: FinishedMatchScoreRowProps) {
  const hasPrediction =
    predictedHome != null &&
    predictedAway != null &&
    Number.isInteger(predictedHome) &&
    Number.isInteger(predictedAway);

  const outcome = hasPrediction
    ? resolveScoreOutcome({
        predictedHome: predictedHome!,
        predictedAway: predictedAway!,
        resultHome: homeGoals,
        resultAway: awayGoals,
      })
    : null;

  const predictedText = hasPrediction ? formatListScore(predictedHome, predictedAway) : null;

  const scoreClass =
    variant === "modal"
      ? "font-display text-2xl font-semibold tabular-nums leading-none text-white/95"
      : "font-display text-[2.5rem] font-semibold tabular-nums leading-none text-white/95 sm:text-[2.75rem]";

  const homeLeft = variant === "modal" ? "34%" : "15%";
  const awayLeft = variant === "modal" ? "66%" : "85%";
  const topClass = variant === "modal" ? "top-[1.15rem]" : "top-[2.125rem]";
  const rowHeight = variant === "modal" ? "h-10 sm:h-11" : "";

  return (
    <div className={cn("pointer-events-none absolute inset-x-0", topClass, rowHeight, className)}>
      <div
        className={cn("absolute -translate-x-1/2 text-center", scoreClass)}
        style={{ left: homeLeft }}
      >
        {formatGoal(homeGoals)}
      </div>

      <div
        className={cn("absolute -translate-x-1/2 text-center", scoreClass)}
        style={{ left: awayLeft }}
      >
        {formatGoal(awayGoals)}
      </div>

      {hasPrediction && outcome && predictedText ? (
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2",
            variant === "modal" ? "top-[calc(100%+0.25rem)]" : "top-1/2 -translate-y-1/2",
          )}
        >
          <div className="relative pl-1">
            <PredictionStatusBadge outcome={outcome} />
            <p className="text-center text-xs uppercase tracking-wide text-white/50">Tu pronóstico</p>
            <p
              className={cn(
                "text-center font-display font-semibold tabular-nums text-[var(--tm-accent)]",
                variant === "modal" ? "text-sm leading-tight" : "text-xs leading-tight",
              )}
            >
              {predictedText}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
