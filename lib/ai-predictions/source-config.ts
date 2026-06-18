export type PredictionInsightSource = "bsd" | "gemini" | "hybrid";

export function resolvePredictionInsightSource(
  override?: string | null,
): PredictionInsightSource {
  const raw = (override ?? process.env.PREDICTION_INSIGHT_SOURCE ?? "hybrid")
    .trim()
    .toLowerCase();

  if (raw === "bsd" || raw === "gemini" || raw === "hybrid") {
    return raw;
  }

  return "hybrid";
}

export function predictionInsightSourceLabel(source: PredictionInsightSource): string {
  if (source === "hybrid") return "BSD + Gemini";
  if (source === "gemini") return "Gemini";
  return "BSD";
}

/** Caché híbrida: regenerar si el insight es más antiguo que esto. */
export const HYBRID_INSIGHT_CACHE_MS = 4 * 60 * 60 * 1000;
