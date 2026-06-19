export type BsdMatchOutcome = "H" | "D" | "A";

export function parseScoreLine(score: string): [number, number] | null {
  const parts = score.split("-").map((part) => Number(part.trim()));
  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) {
    return null;
  }
  return [parts[0]!, parts[1]!];
}

export function scoreLineOutcome(home: number, away: number): BsdMatchOutcome {
  if (home > away) return "H";
  if (home < away) return "A";
  return "D";
}

export function resolveFavoriteOutcome(
  predicted: string | null | undefined,
  probHome: number,
  probDraw: number,
  probAway: number,
): BsdMatchOutcome {
  if (predicted === "H" || predicted === "D" || predicted === "A") return predicted;
  if (probHome >= probDraw && probHome >= probAway) return "H";
  if (probAway >= probDraw && probAway >= probHome) return "A";
  return "D";
}

export function alignScoreToOutcome(
  home: number,
  away: number,
  outcome: BsdMatchOutcome,
): [number, number] {
  if (outcome === "H") {
    if (home > away) return [home, away];
    if (home === 0 && away === 0) return [1, 0];
    return [away + 1, away];
  }

  if (outcome === "A") {
    if (away > home) return [home, away];
    if (home === 0 && away === 0) return [0, 1];
    return [home, home + 1];
  }

  if (home === away) return [home, away];
  const level = Math.max(0, Math.round((home + away) / 2));
  return [level, level];
}

/** Marcador UI alineado con el favorito 1X2 de BSD (evita 0-1 visitante con local al 56%). */
export function resolveBsdDisplayScore(input: {
  predicted?: string | null;
  probHome: number;
  probDraw: number;
  probAway: number;
  mostLikely?: string | null;
  xgHome: number;
  xgAway: number;
}): string {
  const favorite = resolveFavoriteOutcome(
    input.predicted,
    input.probHome,
    input.probDraw,
    input.probAway,
  );

  const mostLikely = input.mostLikely?.trim();
  if (mostLikely) {
    const parsed = parseScoreLine(mostLikely);
    if (parsed && scoreLineOutcome(parsed[0], parsed[1]) === favorite) {
      return mostLikely;
    }
  }

  const roundedHome = Math.max(0, Math.round(input.xgHome));
  const roundedAway = Math.max(0, Math.round(input.xgAway));
  const [home, away] = alignScoreToOutcome(roundedHome, roundedAway, favorite);
  return `${home}-${away}`;
}
