import { PredictionOutcomeIcon } from "@/components/predictions/PredictionOutcomeIcon";
import type { ScoreOutcome } from "@/lib/predictions/prediction-outcome";
import { computeBoardRowTotalPoints } from "@/lib/predictions/scoring";

type MatchPredictionsBoardOutcomeProps = {
  scoreOutcome: ScoreOutcome | null;
  mvpCorrect: boolean;
  /** Inicio: tick verde también en acierto de signo (1X2). Calendario: solo exacto. */
  showSignOutcomeTicks?: boolean;
};

export function MatchPredictionsBoardPointsLabel({
  scoreOutcome,
  mvpCorrect,
}: MatchPredictionsBoardOutcomeProps) {
  const totalPoints = computeBoardRowTotalPoints(scoreOutcome, mvpCorrect);
  if (totalPoints === 0) return null;

  return (
    <span className="whitespace-nowrap text-[9px] font-semibold leading-none text-[var(--tm-primary)]">
      +{totalPoints} pts
    </span>
  );
}

export function MatchPredictionsBoardOutcomeIconTicks({
  scoreOutcome,
  mvpCorrect,
  showSignOutcomeTicks = false,
}: MatchPredictionsBoardOutcomeProps) {
  const tickCount =
    scoreOutcome === "exact"
      ? 2
      : showSignOutcomeTicks && scoreOutcome === "sign"
        ? 1
        : 0;
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

/** Columna de aciertos: total en amarillo, ticks verdes (signo ×1 si aplica, exacto ×2) y estrella MVP. */
export function MatchPredictionsBoardOutcomeIcons({
  scoreOutcome,
  mvpCorrect,
  showSignOutcomeTicks = false,
}: MatchPredictionsBoardOutcomeProps) {
  const totalPoints = computeBoardRowTotalPoints(scoreOutcome, mvpCorrect);
  if (totalPoints === 0) return null;

  return (
    <span className="inline-flex shrink-0 items-center gap-0.5" aria-hidden>
      <MatchPredictionsBoardPointsLabel scoreOutcome={scoreOutcome} mvpCorrect={mvpCorrect} />
      <MatchPredictionsBoardOutcomeIconTicks
        scoreOutcome={scoreOutcome}
        mvpCorrect={mvpCorrect}
        showSignOutcomeTicks={showSignOutcomeTicks}
      />
    </span>
  );
}
