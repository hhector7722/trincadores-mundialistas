import { PredictionOutcomeIcon } from "@/components/predictions/PredictionOutcomeIcon";
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
  return value === 0 ? " " : String(value);
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

  const isExact = outcome === "exact";
  const showPredictedBelow = outcome === "sign" || outcome === "miss";
  const predictedText = hasPrediction ? formatListScore(predictedHome, predictedAway) : null;

  const scoreClass =
    variant === "modal"
      ? "font-display text-2xl font-semibold tabular-nums leading-none"
      : "font-display text-[2.5rem] font-semibold tabular-nums leading-none sm:text-[2.75rem]";

  const homeLeft = variant === "modal" ? "34%" : "15%";
  const awayLeft = variant === "modal" ? "66%" : "85%";
  const topClass = variant === "modal" ? "top-[1.15rem]" : "top-[2.125rem]";
  const rowHeight = variant === "modal" ? "h-10 sm:h-11" : "";

  const goalColorClass = isExact
    ? "text-emerald-400 [-webkit-text-stroke:1.5px_white] [paint-order:stroke_fill]"
    : "text-white/95";

  return (
    <div className={cn("pointer-events-none absolute inset-x-0", topClass, rowHeight, className)}>
      <div
        className={cn(
          "absolute -translate-x-1/2 text-center",
          scoreClass,
          goalColorClass,
        )}
        style={{ left: homeLeft }}
      >
        {formatGoal(homeGoals)}
      </div>

      <div
        className={cn(
          "absolute -translate-x-1/2 text-center",
          scoreClass,
          goalColorClass,
        )}
        style={{ left: awayLeft }}
      >
        {formatGoal(awayGoals)}
      </div>

      {outcome ? (
        <div
          className={cn(
            "absolute left-1/2 flex -translate-x-1/2 flex-col items-center",
            variant === "modal" ? "top-1/2 -translate-y-1/2" : "top-1/2 -translate-y-1/2",
          )}
          style={{ fontSize: variant === "modal" ? "1.5rem" : "2.5rem" }}
        >
          <PredictionOutcomeIcon variant={isExact || outcome === "sign" ? "success" : "error"} />
          {showPredictedBelow && predictedText ? (
            <p
              className={cn(
                "mt-0.5 text-center font-display font-semibold tabular-nums text-[var(--tm-accent)]",
                variant === "modal" ? "text-sm" : "text-xs",
              )}
            >
              {predictedText}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
