import type { ResolvedLineup } from "@/lib/lineup/types";

const FIFA_SQUAD_SHIRT_MAX = 26;

/** Dorsales repetidos entre titulares (caché anterior al matching oficial). */
export function hasDuplicateStarterShirts(lineup: ResolvedLineup): boolean {
  const shirts = lineup.slots
    .filter((slot) => !slot.isPlaceholder)
    .map((slot) => slot.shirtNumber)
    .filter((shirt): shirt is number => shirt != null);

  return new Set(shirts).size !== shirts.length;
}

/** Caché predicted obsoleta: duplicados o dorsales fuera de convocatoria FIFA (1–26). */
export function isPredictedLineupCacheStale(lineup: ResolvedLineup): boolean {
  if (lineup.sourceKind !== "predicted") return false;

  const shirts = lineup.slots
    .filter((slot) => !slot.isPlaceholder)
    .map((slot) => slot.shirtNumber)
    .filter((shirt): shirt is number => shirt != null);

  if (hasDuplicateStarterShirts(lineup)) return true;

  if (
    lineup.slots.some(
      (slot) => slot.isPlaceholder && slot.name.trim().toLowerCase() === "por confirmar"
    )
  ) {
    return true;
  }

  if (
    lineup.slots.some((slot) => !slot.isPlaceholder && slot.shirtNumber == null)
  ) {
    return true;
  }

  if (shirts.length === 0) return false;

  return shirts.some((shirt) => shirt < 1 || shirt > FIFA_SQUAD_SHIRT_MAX);
}
