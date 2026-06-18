import {
  fetchBsdPredictionForEvent,
  mapBsdPredictionToInsight,
  type BsdPredictionPayload,
} from "@/lib/ai-predictions/sources/bsd-insight";
import {
  generateGeminiNarrative,
  type BsdNumericContext,
} from "@/lib/ai-predictions/sources/gemini-narrative";
import { isGeminiConfigured } from "@/lib/ai-predictions/sources/gemini-client";
import { isBsdConfigured } from "@/lib/lineup/sources/bsd-client";
import type { GeneratedPredictionInsight } from "@/lib/ai-predictions/types";
import { teamNameEs } from "@/lib/teams/display";

function roundProb(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function mapConfidence(favoriteProb: number, modelConfidence: number | null): string {
  const signal = Math.max(favoriteProb, (modelConfidence ?? 0) * 100);
  if (signal >= 55) return "Alta";
  if (signal >= 45) return "Media";
  return "Baja";
}

function formatMainPrediction(homeEs: string, awayEs: string, score: string): string {
  const [homeGoals, awayGoals] = score.split("-").map((part) => part.trim());
  if (!homeGoals || !awayGoals) return `${homeEs} vs ${awayEs}`;
  return `${homeEs} ${homeGoals}-${awayGoals} ${awayEs}`;
}

export function mapBsdPayloadToNumericContext(
  payload: BsdPredictionPayload,
  homeTeam: string,
  awayTeam: string,
): BsdNumericContext {
  const homeEs = teamNameEs(homeTeam);
  const awayEs = teamNameEs(awayTeam);
  const matchResult = payload.markets?.match_result ?? {};
  const expectedGoals = payload.markets?.expected_goals ?? {};
  const btts = payload.markets?.btts ?? {};
  const score = payload.markets?.score ?? {};

  const probHome = roundProb(matchResult.prob_home);
  const probDraw = roundProb(matchResult.prob_draw);
  const probAway = roundProb(matchResult.prob_away);
  const xgHome = typeof expectedGoals.home === "number" ? expectedGoals.home : 0;
  const xgAway = typeof expectedGoals.away === "number" ? expectedGoals.away : 0;
  const bttsProb = roundProb(btts.prob_yes);
  const mostLikely = (score.most_likely ?? `${Math.round(xgHome)}-${Math.round(xgAway)}`).trim();
  const favoriteProb = Math.max(probHome, probDraw, probAway);

  return {
    mainPrediction: formatMainPrediction(homeEs, awayEs, mostLikely),
    confidence: mapConfidence(favoriteProb, payload.model?.confidence ?? null),
    homeWinProb: probHome,
    drawProb: probDraw,
    awayWinProb: probAway,
    mostLikelyScore: mostLikely,
    xgHome,
    xgAway,
    bttsProb,
  };
}

export async function generateHybridPredictionInsight(input: {
  bsdEventId: number;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  stageLabel?: string | null;
}): Promise<{ insight: GeneratedPredictionInsight; updatedAt: string }> {
  if (!isBsdConfigured()) {
    throw new Error("BSD_API_KEY no configurada.");
  }
  if (!isGeminiConfigured()) {
    throw new Error("GEMINI_API_KEY no configurada.");
  }

  const prediction = await fetchBsdPredictionForEvent(input.bsdEventId);
  if (!prediction?.markets?.match_result) {
    throw new Error("BSD no tiene prediccion ML para este evento.");
  }

  const numeric = mapBsdPayloadToNumericContext(
    prediction,
    input.homeTeam,
    input.awayTeam,
  );

  const narrative = await generateGeminiNarrative({
    homeTeam: input.homeTeam,
    awayTeam: input.awayTeam,
    kickoffAt: input.kickoffAt,
    stageLabel: input.stageLabel,
    numeric,
  });

  const bsdFallback = mapBsdPredictionToInsight(
    prediction,
    input.homeTeam,
    input.awayTeam,
    " ",
  );

  return {
    insight: {
      mainPrediction: numeric.mainPrediction,
      confidence: numeric.confidence,
      homeWinProb: numeric.homeWinProb,
      drawProb: numeric.drawProb,
      awayWinProb: numeric.awayWinProb,
      mvpPlayerName: narrative.mvpPlayerName,
      analysis: narrative.analysis,
      alternatives:
        narrative.alternatives.length >= 2
          ? narrative.alternatives
          : bsdFallback.alternatives,
    },
    updatedAt: new Date().toISOString(),
  };
}
