import { resolveFormationSlotsFromLineup } from "@/lib/lineup/resolve-formation-slots";
import type { LineupSlot, ResolvedLineup } from "@/lib/lineup/types";

/**
 * @deprecated Usar `resolveFormationSlotsFromLineup`.
 * La versión anterior preservaba x/y de caché y usaba `pool.shift()`, rompiendo la invariante táctica.
 */
export function ensureElevenStarterSlots(lineup: ResolvedLineup): LineupSlot[] {
  return resolveFormationSlotsFromLineup(lineup);
}
