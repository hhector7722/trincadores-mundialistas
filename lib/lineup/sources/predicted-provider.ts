import type { PredictedLineupProvider } from "@/lib/lineup/sources/types";
import type { ResolvedLineup } from "@/lib/lineup/types";

/**
 * Proveedor de once predicho — enchufable.
 * Hoy no hay fuente gratuita fiable de predicted lineups para WC 2026;
 * devuelve null y deja pasar al fallback interno.
 */
export async function fetchPredictedLineup(): Promise<ResolvedLineup | null> {
  return null;
}

export const predictedLineupProvider: PredictedLineupProvider = {
  code: "predicted_stub",
  fetchPredictedLineup: async () => fetchPredictedLineup(),
};
