import { resolveFormationSlotsFromLineup } from "@/lib/lineup/resolve-formation-slots";
import { FOTMOB_SOURCE_CODE } from "@/lib/lineup/sources/fotmob-client";
import type { LineupSlot, ResolvedLineup } from "@/lib/lineup/types";

/** Alineación confirmada FotMob ya trae coords reales; no re-emparejar a plantilla. */
export function lineupUsesSourceLayout(lineup: ResolvedLineup): boolean {
  return lineup.sourceKind === "confirmed" && lineup.dataSourceCode === FOTMOB_SOURCE_CODE;
}

/** Slots listos para pintar: respeta layout de fuente o normaliza por formación. */
export function resolveVisualLineupSlots(lineup: ResolvedLineup): LineupSlot[] {
  if (lineupUsesSourceLayout(lineup)) {
    return lineup.slots.slice(0, 11).map((slot) => ({
      ...slot,
      slotKey: slot.slotKey?.trim() || "CM",
    }));
  }

  return resolveFormationSlotsFromLineup(lineup);
}
