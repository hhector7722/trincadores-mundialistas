import type { ScoreOutcome } from "@/lib/predictions/prediction-outcome";

export type PredictionOutcomeIconVariant = "success" | "error" | "mvp";

export type ResolvePredictionOutcomeIconsInput = {
  scoreOutcome: ScoreOutcome | null;
  mvpCorrect: boolean;
  hasScorePrediction?: boolean;
  /** Calendario finalizado: cruz roja si falló signo/marcador. */
  showMissIndicator?: boolean;
  /** Tick verde también en acierto de signo (1X2). */
  showSignOutcomeTicks?: boolean;
};

/** Iconos de acierto: ticks (×1 signo, ×2 exacto), cruz en fallo, estrella MVP. */
export function resolvePredictionOutcomeIcons({
  scoreOutcome,
  mvpCorrect,
  hasScorePrediction = true,
  showMissIndicator = false,
  showSignOutcomeTicks = true,
}: ResolvePredictionOutcomeIconsInput): PredictionOutcomeIconVariant[] {
  const icons: PredictionOutcomeIconVariant[] = [];

  if (scoreOutcome === "exact_and_advancing") {
    icons.push("success", "success", "success");
  } else if (scoreOutcome === "exact") {
    icons.push("success", "success");
  } else if (scoreOutcome === "advancing" || (scoreOutcome === "sign" && showSignOutcomeTicks)) {
    icons.push("success");
  } else if (showMissIndicator && hasScorePrediction && scoreOutcome === "miss") {
    icons.push("error");
  }

  if (mvpCorrect) {
    icons.push("mvp");
  }

  return icons;
}
