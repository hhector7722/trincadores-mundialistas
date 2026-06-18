import type { PredictionInsight, PredictionInsightSource } from "@/lib/ai-predictions/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type PredictionInsightRow = {
  match_id: string;
  main_prediction: string;
  confidence: string;
  mvp_player_name: string;
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  analysis: string;
  alternatives: unknown;
  source_code: PredictionInsightSource;
  updated_at: string;
};

function parseAlternatives(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function mapPredictionInsightRow(row: PredictionInsightRow): PredictionInsight {
  return {
    matchId: row.match_id,
    mainPrediction: row.main_prediction,
    confidence: row.confidence,
    mvpPlayerName: row.mvp_player_name,
    homeWinProb: row.home_win_prob,
    drawProb: row.draw_prob,
    awayWinProb: row.away_win_prob,
    analysis: row.analysis,
    alternatives: parseAlternatives(row.alternatives),
    sourceCode: row.source_code,
    updatedAt: row.updated_at,
  };
}

const INSIGHT_SELECT =
  "match_id, main_prediction, confidence, mvp_player_name, home_win_prob, draw_prob, away_win_prob, analysis, alternatives, source_code, updated_at";

export async function getPredictionInsightForMatch(
  matchId: string,
): Promise<PredictionInsight | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prediction_insights")
    .select(INSIGHT_SELECT)
    .eq("match_id", matchId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapPredictionInsightRow(data as PredictionInsightRow);
}

export async function upsertPredictionInsightRow(
  matchId: string,
  sourceCode: PredictionInsightSource,
  insight: Omit<PredictionInsight, "matchId" | "sourceCode" | "updatedAt">,
  updatedAt: string,
): Promise<PredictionInsight> {
  const admin = createAdminClient();
  const { error } = await admin.from("prediction_insights").upsert(
    {
      match_id: matchId,
      source_code: sourceCode,
      main_prediction: insight.mainPrediction,
      confidence: insight.confidence,
      mvp_player_name: insight.mvpPlayerName,
      home_win_prob: insight.homeWinProb,
      draw_prob: insight.drawProb,
      away_win_prob: insight.awayWinProb,
      analysis: insight.analysis,
      alternatives: insight.alternatives,
      updated_at: updatedAt,
    },
    { onConflict: "match_id" },
  );

  if (error) {
    throw new Error(`Upsert prediction_insights: ${error.message}`);
  }

  return {
    matchId,
    sourceCode,
    updatedAt,
    ...insight,
  };
}
