import type { ResolvedLineup } from "@/lib/lineup/types";
import {
  BSD_PREDICTED_SOURCE_CODE,
  BSD_SOURCE_CODE,
} from "@/lib/lineup/sources/bsd-constants";

/** Dorsales repetidos entre titulares (cache anterior al matching oficial). */
export function hasDuplicateStarterShirts(lineup: ResolvedLineup): boolean {
  const shirts = lineup.slots
    .filter((slot) => !slot.isPlaceholder)
    .map((slot) => slot.shirtNumber)
    .filter((shirt): shirt is number => shirt != null);

  return new Set(shirts).size !== shirts.length;
}

/** Cache predicted obsoleta: duplicados, placeholders o BSD anterior a la politica de dorsales. */
export function isPredictedLineupCacheStale(lineup: ResolvedLineup): boolean {
  if (lineup.sourceKind !== "predicted") return false;

  if (hasDuplicateStarterShirts(lineup)) return true;
  if (lineup.dataSourceCode === BSD_SOURCE_CODE) return true;

  if (
    lineup.slots.some(
      (slot) => slot.isPlaceholder && slot.name.trim().toLowerCase() === "por confirmar"
    )
  ) {
    return true;
  }

  return lineup.dataSourceCode !== BSD_PREDICTED_SOURCE_CODE && lineup.dataSourceCode != null;
}
