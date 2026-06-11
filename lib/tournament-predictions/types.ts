export type TournamentGeneralPredictions = {
  poolId: string;
  profileId: string;
  championTeam: string | null;
  finalistTeamA: string | null;
  finalistTeamB: string | null;
  topScorerPlayerName: string | null;
  topScorerTeamName: string | null;
  tournamentMvpPlayerName: string | null;
  tournamentMvpTeamName: string | null;
  goldenGlovePlayerName: string | null;
  goldenGloveTeamName: string | null;
  updatedAt: string | null;
};

export type TournamentGeneralPredictionField =
  | "champion"
  | "finalists"
  | "top_scorer"
  | "tournament_mvp"
  | "golden_glove";

export const TOURNAMENT_GENERAL_PREDICTION_LABELS: Record<
  TournamentGeneralPredictionField,
  string
> = {
  champion: "Campeón",
  finalists: "Finalistas",
  top_scorer: "Pichichi",
  tournament_mvp: "MVP",
  golden_glove: "Guante oro",
};

export type TournamentGeneralPredictionsBoardRow = {
  profileId: string;
  label: string;
  avatarUrl: string | null;
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
