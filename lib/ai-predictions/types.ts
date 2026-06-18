export type PredictionInsightSource = "bsd" | "gemini" | "hybrid";

export type PredictionInsight = {
  matchId: string;
  mainPrediction: string;
  confidence: string;
  mvpPlayerName: string;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  analysis: string;
  alternatives: string[];
  sourceCode: PredictionInsightSource;
  updatedAt: string;
};

export type GeneratedPredictionInsight = Omit<
  PredictionInsight,
  "matchId" | "sourceCode" | "updatedAt"
>;
