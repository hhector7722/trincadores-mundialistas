import { MATCH_SCORE_POINTS } from "@/lib/predictions/scoring";

export type ScoreInput = {
  predictedHome: number;
  predictedAway: number;
  predictedAdvancing?: "home" | "away" | null;
  resultHome: number;
  resultAway: number;
  resultPenaltyHome?: number | null;
  resultPenaltyAway?: number | null;
  isKnockout?: boolean;
};

/** Resultado 1X2: 1 = local, 0 = empate, -1 = visitante */
export function matchOutcome(home: number, away: number): -1 | 0 | 1 {
  if (home > away) return 1;
  if (home < away) return -1;
  return 0;
}

/**
 * Simula la lógica de puntos (Fase de grupos vs Eliminatorias).
 * Fase de grupos: 5 exacto, 2 signo.
 * Eliminatorias: 5 exacto+clasificado, 3 exacto sin clasificado, 2 clasificado sin exacto.
 */
export function computeMatchPoints(input: ScoreInput): 0 | 2 | 3 | 5 {
  const {
    predictedHome,
    predictedAway,
    predictedAdvancing,
    resultHome,
    resultAway,
    resultPenaltyHome,
    resultPenaltyAway,
    isKnockout,
  } = input;

  if (!isKnockout) {
    if (predictedHome === resultHome && predictedAway === resultAway) {
      return MATCH_SCORE_POINTS.exact; // 5
    }
    if (matchOutcome(predictedHome, predictedAway) === matchOutcome(resultHome, resultAway)) {
      return MATCH_SCORE_POINTS.sign; // 2
    }
    return MATCH_SCORE_POINTS.miss; // 0
  }

  // Lógica eliminatorias
  const exactScore = predictedHome === resultHome && predictedAway === resultAway;

  let actualAdv: "home" | "away" | null = null;
  if (resultHome > resultAway) actualAdv = "home";
  else if (resultHome < resultAway) actualAdv = "away";
  else if ((resultPenaltyHome || 0) > (resultPenaltyAway || 0)) actualAdv = "home";
  else if ((resultPenaltyHome || 0) < (resultPenaltyAway || 0)) actualAdv = "away";
  // Si está empatado y no hay penaltis (por ejemplo partido en directo), actualAdv = null

  let predictedAdv: "home" | "away" | null = null;
  if (predictedHome > predictedAway) predictedAdv = "home";
  else if (predictedHome < predictedAway) predictedAdv = "away";
  else predictedAdv = predictedAdvancing || null;

  const correctAdv = predictedAdv !== null && predictedAdv === actualAdv;

  if (exactScore && correctAdv) return 5;
  if (exactScore && !correctAdv) return 3;
  if (correctAdv) return 2;
  return 0;
}
