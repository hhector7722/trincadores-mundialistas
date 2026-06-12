import { PredictionOutcomeIcon } from "@/components/predictions/PredictionOutcomeIcon";
import type { ScoreOutcome } from "@/lib/predictions/prediction-outcome";

type MatchPredictionsBoardOutcomeIconsProps = {
  scoreOutcome: ScoreOutcome | null;
  mvpCorrect: boolean;
};

/** Tras el nombre: ticks verdes (signo ×1, exacto ×2) y estrella MVP a la derecha. */
export function MatchPredictionsBoardOutcomeIcons({
  scoreOutcome,
  mvpCorrect,
}: MatchPredictionsBoardOutcomeIconsProps) {
  const tickCount = scoreOutcome === "exact" ? 2 : scoreOutcome === "sign" ? 1 : 0;
  if (tickCount === 0 && !mvpCorrect) return null;

  return (
    <span className="inline-flex shrink-0 items-center gap-0.5" aria-hidden>
      {Array.from({ length: tickCount }, (_, index) => (
        <PredictionOutcomeIcon key={`tick-${index}`} variant="success" className="text-[10px]" />
      ))}
      {mvpCorrect ? <PredictionOutcomeIcon variant="mvp" /> : null}
    </span>
  );
}
