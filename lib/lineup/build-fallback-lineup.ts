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

import { getFormationSlotAnchors } from "@/lib/lineup/formation-coordinates";
import { normalizeFormationTemplate } from "@/lib/lineup/formation-templates";
import { positionLabelEs } from "@/lib/lineup/position-map";
import type { LineupSlot, PositionRole } from "@/lib/lineup/types";

function slotRoleForAnchorKey(slotKey: string): PositionRole {
  if (slotKey === "GK") return "GK";
  if (["LST", "RST", "ST", "LW", "RW"].includes(slotKey)) return "FW";
  if (["LB", "RB", "LCB", "RCB", "CB", "LWB", "RWB"].includes(slotKey)) return "DF";
  return "MF";
}

/** Asigna directamente los 11 jugadores a las coordenadas de la formación sin heurística. */
export function buildExactHardcodedLineup(
  players: LineupPlayerInput[],
  formationId: FormationId,
  startingNumbers: number[]
): ResolvedLineup {
  const anchors = getFormationSlotAnchors(formationId);
  const slots: LineupSlot[] = anchors.map((anchor, i) => {
    // Si tenemos más anchors que startingNumbers o viceversa, lo manejamos seguro
    const shirtNumber = startingNumbers[i];
    const player = shirtNumber != null ? players.find((p) => p.shirt_number === shirtNumber) : undefined;
    
    if (!player) {
      return {
        key: `placeholder-${anchor.key}-${i}`,
        name: "Por confirmar",
        shirtNumber: null,
        positionLabel: anchor.key,
        role: slotRoleForAnchorKey(anchor.key),
        isPlaceholder: true,
        slotKey: anchor.key,
        x: anchor.coord.x,
        y: anchor.coord.y,
      };
    }
    
    return {
      key: `${player.player_name}-${shirtNumber}`,
      name: player.player_name,
      shirtNumber,
      positionLabel: positionLabelEs(slotRoleForAnchorKey(anchor.key), null),
      role: slotRoleForAnchorKey(anchor.key),
      isPlaceholder: false,
      slotKey: anchor.key,
      x: anchor.coord.x,
      y: anchor.coord.y,
    };
  });

  return {
    formation: normalizeFormationTemplate(formationId),
    formationLabel: formationId,
    slots,
    bench: [], // se calcula luego en resolve-lineup.ts
    benchCount: 0,
    isProbable: true,
    sourceKind: "fallback",
    dataSourceCode: null,
    fetchedAt: null,
  };
}
