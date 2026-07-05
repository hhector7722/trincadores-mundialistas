import { shouldFetchConfirmedLineup } from "@/lib/lineup/confirmed-lineup-window";
import type { ResolvedLineup } from "@/lib/lineup/types";
import {
  BSD_PREDICTED_SOURCE_CODE,
  BSD_SOURCE_CODE,
} from "@/lib/lineup/sources/bsd-constants";

const CONFIRMED_REFRESH_MS = 5 * 60 * 1000;

/** Dorsales repetidos entre titulares (cache anterior al matching oficial). */
export function hasDuplicateStarterShirts(lineup: ResolvedLineup): boolean {
  const shirts = lineup.slots
    .filter((slot) => !slot.isPlaceholder)
    .map((slot) => slot.shirtNumber)
    .filter((shirt): shirt is number => shirt != null);

  return new Set(shirts).size !== shirts.length;
}

function hasGhostBsdStarters(lineup: ResolvedLineup): boolean {
  return lineup.slots.some((slot) => {
    if (slot.isPlaceholder) return false;
    if (slot.shirtNumber == null) return slot.name.trim().toLowerCase() !== "por confirmar";
    return false;
  });
}

/** Cache predicted obsoleta: duplicados, fantasmas BSD o política anterior a convocatoria-only. */
export function isPredictedLineupCacheStale(lineup: ResolvedLineup): boolean {
  if (lineup.sourceKind !== "predicted") return false;

  if (hasDuplicateStarterShirts(lineup)) return true;
  if (lineup.dataSourceCode === BSD_SOURCE_CODE) return true;
  if (hasGhostBsdStarters(lineup)) return true;

  if (
    lineup.slots.some(
      (slot) => slot.isPlaceholder && slot.name.trim().toLowerCase() === "por confirmar"
    )
  ) {
    return true;
  }

  return lineup.dataSourceCode !== BSD_PREDICTED_SOURCE_CODE && lineup.dataSourceCode != null;
}

function hasPlaceholderStarters(lineup: ResolvedLineup): boolean {
  return lineup.slots.some(
    (slot) =>
      slot.isPlaceholder ||
      !slot.name?.trim() ||
      slot.name.trim().toLowerCase() === "por confirmar"
  );
}

/** Cache confirmada obsoleta: partido en vivo, placeholders o antigüedad en ventana T-90. */
export function isConfirmedLineupCacheStale(
  lineup: ResolvedLineup,
  kickoffAt: string | null | undefined,
  status: string | null | undefined,
  nowMs: number = Date.now()
): boolean {
  if (lineup.sourceKind !== "confirmed") return false;
  if (status === "finished") return false; // Never stale if finished
  if (status === "live") return true;
  if (hasPlaceholderStarters(lineup)) return true;

  const starters = lineup.slots.filter((slot) => !slot.isPlaceholder);
  if (starters.length < 11) return true;

  if (!shouldFetchConfirmedLineup(kickoffAt, status, nowMs)) return false;

  const fetchedMs = lineup.fetchedAt ? Date.parse(lineup.fetchedAt) : Number.NaN;
  if (!Number.isFinite(fetchedMs)) return true;
  return nowMs - fetchedMs > CONFIRMED_REFRESH_MS;
}
