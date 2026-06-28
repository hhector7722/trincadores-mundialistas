import { PredictionOutcomeIcon } from "@/components/predictions/PredictionOutcomeIcon";
import type { ScoreOutcome } from "@/lib/predictions/prediction-outcome";
import { resolvePredictionOutcomeIcons } from "@/lib/predictions/prediction-outcome-icons";
import { computeBoardRowTotalPoints } from "@/lib/predictions/scoring";
type MatchPredictionsBoardOutcomeProps = {
  scoreOutcome: ScoreOutcome | null;
  mvpCorrect: boolean;
  /** Inicio: tick verde también en acierto de signo (1X2). Calendario: solo exacto. */
  showSignOutcomeTicks?: boolean;
  isKnockout?: boolean;
};

export function MatchPredictionsBoardPointsLabel({
  scoreOutcome,
  mvpCorrect,
  isKnockout = false,
}: MatchPredictionsBoardOutcomeProps) {
  const totalPoints = computeBoardRowTotalPoints(scoreOutcome, mvpCorrect, isKnockout);
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
  const icons = resolvePredictionOutcomeIcons({
    scoreOutcome,
    mvpCorrect,
    showMissIndicator: false,
    showSignOutcomeTicks,
  });
  if (icons.length === 0) return null;

  return (
    <span className="inline-flex shrink-0 items-center gap-0.5" aria-hidden>
      {icons.map((variant, index) => (
        <PredictionOutcomeIcon key={`${variant}-${index}`} variant={variant} className="text-[10px]" />
      ))}
    </span>
  );
}

/** Columna de aciertos: total en amarillo, ticks verdes (signo ×1 si aplica, exacto ×2) y estrella MVP. */
export function MatchPredictionsBoardOutcomeIcons({
  scoreOutcome,
  mvpCorrect,
  showSignOutcomeTicks = false,
  isKnockout = false,
}: MatchPredictionsBoardOutcomeProps) {
  const totalPoints = computeBoardRowTotalPoints(scoreOutcome, mvpCorrect, isKnockout);
  if (totalPoints === 0) return null;

  return (
    <span className="inline-flex shrink-0 items-center gap-0.5" aria-hidden>
      <MatchPredictionsBoardPointsLabel scoreOutcome={scoreOutcome} mvpCorrect={mvpCorrect} isKnockout={isKnockout} />
      <MatchPredictionsBoardOutcomeIconTicks
        scoreOutcome={scoreOutcome}
        mvpCorrect={mvpCorrect}
        showSignOutcomeTicks={showSignOutcomeTicks}
        isKnockout={isKnockout}
      />
    </span>
  );
}
