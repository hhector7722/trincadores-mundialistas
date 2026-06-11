import type { MatchSubstitution, SubstitutionMarkers } from "@/lib/live/types";

function normalizePlayerKey(name: string, shirtNumber?: number | null): string {
  const base = name.trim().toLowerCase();
  if (shirtNumber != null && shirtNumber > 0) return `${base}#${shirtNumber}`;
  return base;
}

export function buildSubstitutionMarkers(
  substitutions: MatchSubstitution[],
  teamSide: "home" | "away",
): SubstitutionMarkers {
  const subbedOutKeys = new Set<string>();
  const subbedInKeys = new Set<string>();

  for (const sub of substitutions) {
    if (sub.teamSide !== teamSide) continue;
    if (sub.playerOut && sub.playerOut !== "—") {
      subbedOutKeys.add(normalizePlayerKey(sub.playerOut));
    }
    if (sub.playerIn && sub.playerIn !== "—") {
      subbedInKeys.add(normalizePlayerKey(sub.playerIn));
    }
  }

  return { subbedOutKeys, subbedInKeys };
}

export function substitutionMarkerForPlayer(
  playerName: string,
  shirtNumber: number | null | undefined,
  markers: SubstitutionMarkers,
): "in" | "out" | null {
  const key = normalizePlayerKey(playerName, shirtNumber);
  const bare = normalizePlayerKey(playerName);

  if (markers.subbedOutKeys.has(key) || markers.subbedOutKeys.has(bare)) return "out";
  if (markers.subbedInKeys.has(key) || markers.subbedInKeys.has(bare)) return "in";
  return null;
}
