import { computeMatchPoints, type ScoreInput } from "@/lib/scoring/compute";

export type ScoreOutcome = "exact_and_advancing" | "exact" | "advancing" | "sign" | "miss";

export function resolveScoreOutcome(input: ScoreInput): ScoreOutcome {
  const points = computeMatchPoints(input);
  if (input.isKnockout) {
    if (points === 5) return "exact_and_advancing";
    if (points === 3) return "exact";
    if (points === 2) return "advancing";
    return "miss";
  } else {
    if (points === 5) return "exact";
    if (points === 2) return "sign";
    return "miss";
  }
}

export { isMvpPredictionCorrect } from "@/lib/predictions/mvp-name-match";
