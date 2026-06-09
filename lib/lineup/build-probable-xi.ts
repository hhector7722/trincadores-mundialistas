import {
  fallbackSlotKeyForRole,
  normalizeFormationTemplate,
} from "@/lib/lineup/formation-templates";
import {
  formationRoleCounts,
  normalizePositionRole,
  pickFormation,
  positionLabelEs,
} from "@/lib/lineup/position-map";
import { layoutPredictedStarters } from "@/lib/lineup/predicted-slot-layout";
import type {
  FormationId,
  LineupPlayer,
  LineupPlayerInput,
  LineupSlot,
  PositionRole,
  ProbableXIResult,
} from "@/lib/lineup/types";

function sortByShirt(a: LineupPlayerInput, b: LineupPlayerInput): number {
  const na = a.shirt_number ?? 999;
  const nb = b.shirt_number ?? 999;
  return na - nb;
}

function groupByRole(players: LineupPlayerInput[]): Record<PositionRole, LineupPlayerInput[]> {
  const groups: Record<PositionRole, LineupPlayerInput[]> = {
    GK: [],
    DF: [],
    MF: [],
    FW: [],
  };
  for (const p of players) {
    groups[normalizePositionRole(p.position)].push(p);
  }
  for (const role of Object.keys(groups) as PositionRole[]) {
    groups[role].sort(sortByShirt);
  }
  return groups;
}

function toLineupPlayer(
  input: LineupPlayerInput | null,
  role: PositionRole,
  index: number
): LineupPlayer {
  if (!input) {
    return {
      key: `placeholder-${role}-${index}`,
      name: "Por confirmar",
      shirtNumber: null,
      positionLabel: positionLabelEs(role, null),
      role,
      isPlaceholder: true,
    };
  }
  return {
    key: `${input.player_name}-${input.shirt_number ?? index}`,
    name: input.player_name,
    shirtNumber: input.shirt_number,
    positionLabel: positionLabelEs(role, input.position),
    role,
    isPlaceholder: false,
  };
}

function pickPlayersForRole(
  pool: LineupPlayerInput[],
  count: number,
  role: PositionRole
): LineupPlayer[] {
  const picked: LineupPlayer[] = [];
  for (let i = 0; i < count; i++) {
    picked.push(toLineupPlayer(pool[i] ?? null, role, i));
  }
  return picked;
}

/** Construye un once probable desde plantilla/convocatoria. */
export function buildProbableXI(
  players: LineupPlayerInput[],
  formationOverride?: FormationId
): ProbableXIResult {
  const groups = groupByRole(players);
  const formation =
    formationOverride ??
    pickFormation({
      GK: groups.GK.length,
      DF: groups.DF.length,
      MF: groups.MF.length,
      FW: groups.FW.length,
    });

  const counts = formationRoleCounts(formation);
  const templateId = normalizeFormationTemplate(formation);

  const gk = pickPlayersForRole(groups.GK, counts.GK, "GK");
  const df = pickPlayersForRole(groups.DF, counts.DF, "DF");
  const mf = pickPlayersForRole(groups.MF, counts.MF, "MF");
  const fw = pickPlayersForRole(groups.FW, counts.FW, "FW");

  const layoutInputs = [
    ...gk.map((player, index) => ({
      ...player,
      slotKey: fallbackSlotKeyForRole(templateId, "GK", index),
    })),
    ...df.map((player, index) => ({
      ...player,
      slotKey: fallbackSlotKeyForRole(templateId, "DF", index),
    })),
    ...mf.map((player, index) => ({
      ...player,
      slotKey: fallbackSlotKeyForRole(templateId, "MF", index),
    })),
    ...fw.map((player, index) => ({
      ...player,
      slotKey: fallbackSlotKeyForRole(templateId, "FW", index),
    })),
  ];

  const slots: LineupSlot[] = layoutPredictedStarters(layoutInputs, formation);

  const starters = slots.filter((s) => !s.isPlaceholder).length;

  return {
    formation,
    slots,
    benchCount: Math.max(0, players.length - starters),
    isProbable: true,
  };
}
