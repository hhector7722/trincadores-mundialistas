export const MAX_GOALS = 20;

export function parseGoalValue(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > MAX_GOALS) {
    return null;
  }
  return n;
}

export function validatePredictionGoals(
  homeGoals: unknown,
  awayGoals: unknown
): { ok: true; home: number; away: number } | { ok: false; error: string } {
  const home = parseGoalValue(homeGoals);
  const away = parseGoalValue(awayGoals);
  if (home === null || away === null) {
    return {
      ok: false,
      error: `Marcador invalido. Usa enteros entre 0 y ${MAX_GOALS}.`,
    };
  }
  return { ok: true, home, away };
}