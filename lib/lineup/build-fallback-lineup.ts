import { buildProbableXI } from "@/lib/lineup/build-probable-xi";
import type { FormationId, LineupPlayerInput, ResolvedLineup } from "@/lib/lineup/types";

/** Once probable heurístico: dorsal + posición en convocatoria (sistema actual). */
export function buildFallbackLineup(
  players: LineupPlayerInput[],
  formationOverride?: FormationId
): ResolvedLineup {
  const result = buildProbableXI(players, formationOverride);
  return {
    ...result,
    formationLabel: result.formation,
    sourceKind: "fallback",
    dataSourceCode: "internal",
    fetchedAt: null,
  };
}
