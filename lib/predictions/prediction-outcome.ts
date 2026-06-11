import { computeMatchPoints, type ScoreInput } from "@/lib/scoring/compute";

export type ScoreOutcome = "exact" | "sign" | "miss";

export function resolveScoreOutcome(input: ScoreInput): ScoreOutcome {
  const points = computeMatchPoints(input);
  if (points === 5) return "exact";
  if (points === 2) return "sign";
  return "miss";
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

/** Misma regla que `compute_mvp_points` en SQL. */
export function isMvpPredictionCorrect(
  predictedPlayer: string,
  predictedTeam: string,
  officialPlayer: string | null | undefined,
  officialTeam: string | null | undefined,
): boolean {
  if (!officialPlayer?.trim()) return false;
  return (
    normalizeToken(predictedPlayer) === normalizeToken(officialPlayer) &&
    normalizeToken(predictedTeam) === normalizeToken(officialTeam ?? predictedTeam)
  );
}
