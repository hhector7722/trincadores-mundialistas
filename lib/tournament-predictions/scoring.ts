/** Debe coincidir con las funciones `tournament_*_points()` en SQL. */
export const TOURNAMENT_GENERAL_SCORE_POINTS = {
  champion: 10,
  finalistSingle: 2,
  finalists: 5,
  topScorer: 7,
  tournamentMvp: 10,
  goldenGlove: 7,
} as const;

export type TournamentGeneralScoreBreakdown = {
  championPoints: number;
  finalistsPoints: number;
  topScorerPoints: number;
  tournamentMvpPoints: number;
  goldenGlovePoints: number;
  totalPoints: number;
};

function norm(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function playerMatch(
  predPlayer: string | null,
  predTeam: string | null,
  resPlayer: string | null,
  resTeam: string | null
): boolean {
  if (!resPlayer || !predPlayer || !predTeam || !resTeam) return false;
  return norm(predPlayer) === norm(resPlayer) && norm(predTeam) === norm(resTeam);
}

export function computeTournamentChampionPoints(
  predictedTeam: string | null,
  officialTeam: string | null
): number {
  if (!predictedTeam || !officialTeam) return 0;
  return norm(predictedTeam) === norm(officialTeam)
    ? TOURNAMENT_GENERAL_SCORE_POINTS.champion
    : 0;
}

function countFinalistHits(
  predictedA: string | null,
  predictedB: string | null,
  officialA: string | null,
  officialB: string | null
): number {
  if (!officialA || !officialB) return 0;
  const officials = new Set([norm(officialA), norm(officialB)]);
  const predicted = new Set(
    [predictedA, predictedB].filter((team): team is string => Boolean(team?.trim())).map(norm)
  );
  let hits = 0;
  for (const team of predicted) {
    if (officials.has(team)) hits++;
  }
  return hits;
}

/** +2 pts por un finalista acertado; +5 pts si aciertas los dos (orden indiferente). */
export function computeTournamentFinalistsPoints(
  predictedA: string | null,
  predictedB: string | null,
  officialA: string | null,
  officialB: string | null
): number {
  const hits = countFinalistHits(predictedA, predictedB, officialA, officialB);
  if (hits >= 2) return TOURNAMENT_GENERAL_SCORE_POINTS.finalists;
  if (hits === 1) return TOURNAMENT_GENERAL_SCORE_POINTS.finalistSingle;
  return 0;
}

export function computeTournamentPlayerAwardPoints(
  predPlayer: string | null,
  predTeam: string | null,
  resPlayer: string | null,
  resTeam: string | null,
  points: number
): number {
  return playerMatch(predPlayer, predTeam, resPlayer, resTeam) ? points : 0;
}

export type TournamentOfficialAwardsInput = {
  championTeam: string | null;
  finalistTeamA: string | null;
  finalistTeamB: string | null;
  topScorerPlayerName: string | null;
  topScorerTeamName: string | null;
  tournamentMvpPlayerName: string | null;
  tournamentMvpTeamName: string | null;
  goldenGlovePlayerName: string | null;
  goldenGloveTeamName: string | null;
};

export type TournamentGeneralPredictionsInput = {
  championTeam: string | null;
  finalistTeamA: string | null;
  finalistTeamB: string | null;
  topScorerPlayerName: string | null;
  topScorerTeamName: string | null;
  tournamentMvpPlayerName: string | null;
  tournamentMvpTeamName: string | null;
  goldenGlovePlayerName: string | null;
  goldenGloveTeamName: string | null;
};

export function computeTournamentGeneralScoreBreakdown(
  predictions: TournamentGeneralPredictionsInput,
  awards: TournamentOfficialAwardsInput
): TournamentGeneralScoreBreakdown {
  const championPoints = computeTournamentChampionPoints(
    predictions.championTeam,
    awards.championTeam
  );
  const finalistsPoints = computeTournamentFinalistsPoints(
    predictions.finalistTeamA,
    predictions.finalistTeamB,
    awards.finalistTeamA,
    awards.finalistTeamB
  );
  const topScorerPoints = computeTournamentPlayerAwardPoints(
    predictions.topScorerPlayerName,
    predictions.topScorerTeamName,
    awards.topScorerPlayerName,
    awards.topScorerTeamName,
    TOURNAMENT_GENERAL_SCORE_POINTS.topScorer
  );
  const tournamentMvpPoints = computeTournamentPlayerAwardPoints(
    predictions.tournamentMvpPlayerName,
    predictions.tournamentMvpTeamName,
    awards.tournamentMvpPlayerName,
    awards.tournamentMvpTeamName,
    TOURNAMENT_GENERAL_SCORE_POINTS.tournamentMvp
  );
  const goldenGlovePoints = computeTournamentPlayerAwardPoints(
    predictions.goldenGlovePlayerName,
    predictions.goldenGloveTeamName,
    awards.goldenGlovePlayerName,
    awards.goldenGloveTeamName,
    TOURNAMENT_GENERAL_SCORE_POINTS.goldenGlove
  );

  return {
    championPoints,
    finalistsPoints,
    topScorerPoints,
    tournamentMvpPoints,
    goldenGlovePoints,
    totalPoints:
      championPoints +
      finalistsPoints +
      topScorerPoints +
      tournamentMvpPoints +
      goldenGlovePoints,
  };
}
