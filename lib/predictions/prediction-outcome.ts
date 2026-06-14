import { computeMatchPoints, type ScoreInput } from "@/lib/scoring/compute";

export type ScoreOutcome = "exact" | "sign" | "miss";

export function resolveScoreOutcome(input: ScoreInput): ScoreOutcome {
  const points = computeMatchPoints(input);
  if (points === 5) return "exact";
  if (points === 2) return "sign";
  return "miss";
}

export { isMvpPredictionCorrect } from "@/lib/predictions/mvp-name-match";
