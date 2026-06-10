import { buildProbableXI } from "@/lib/lineup/build-probable-xi";
import type { FormationId, LineupPlayerInput, ResolvedLineup } from "@/lib/lineup/types";

export type BuildFallbackLineupOptions = {
  knownFormation?: FormationId;
};

/** Once probable heurístico: dorsal + posición en convocatoria (sistema actual). */
export function buildFallbackLineup(
  players: LineupPlayerInput[],
  options?: BuildFallbackLineupOptions
): ResolvedLineup {
  const result = buildProbableXI(players, options?.knownFormation);
  return {
    ...result,
    formationLabel: result.formation,
    sourceKind: "fallback",
    dataSourceCode: null,
    fetchedAt: null,
  };
}
