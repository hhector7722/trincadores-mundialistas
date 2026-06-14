import { PredictionOutcomeIcon } from "@/components/predictions/PredictionOutcomeIcon";
import type { ScoreOutcome } from "@/lib/predictions/prediction-outcome";
import { computeBoardRowTotalPoints } from "@/lib/predictions/scoring";

type MatchPredictionsBoardOutcomeIconsProps = {
  scoreOutcome: ScoreOutcome | null;
  mvpCorrect: boolean;
};

/** Columna de aciertos: total en amarillo, ticks verdes (signo ×1, exacto ×2) y estrella MVP. */
export function MatchPredictionsBoardOutcomeIcons({
  scoreOutcome,
  mvpCorrect,
}: MatchPredictionsBoardOutcomeIconsProps) {
  const totalPoints = computeBoardRowTotalPoints(scoreOutcome, mvpCorrect);
  if (totalPoints === 0) return null;

  const tickCount = scoreOutcome === "exact" ? 2 : scoreOutcome === "sign" ? 1 : 0;

  return (
    <span className="inline-flex shrink-0 items-center gap-0.5" aria-hidden>
      <span className="whitespace-nowrap text-[9px] font-semibold leading-none text-[var(--tm-primary)]">
        +{totalPoints} pts
      </span>
      {Array.from({ length: tickCount }, (_, index) => (
        <PredictionOutcomeIcon key={`tick-${index}`} variant="success" className="text-[10px]" />
      ))}
      {mvpCorrect ? <PredictionOutcomeIcon variant="mvp" /> : null}
    </span>
  );
}
