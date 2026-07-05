import { resolveFormationSlotsFromLineup } from "@/lib/lineup/resolve-formation-slots";
import type { LineupSlot, ResolvedLineup } from "@/lib/lineup/types";

/** 
 * Elimina el bypass de layout externo.
 * Siempre usamos las plantillas internas, para que el LayoutEngine
 * asigne correctamente las bandas tácticas antes de espaciarlas.
 */
export function resolveVisualLineupSlots(lineup: ResolvedLineup): LineupSlot[] {
  return resolveFormationSlotsFromLineup(lineup);
}
