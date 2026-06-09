import { dedupePlayersByIdentity, normalizePlayerName, playerIdentityKey } from "@/lib/lineup/player-dedupe";
import type { LineupBenchPlayer, LineupSlot } from "@/lib/lineup/types";

export { normalizePlayerName };

export function starterIdentitySet(slots: LineupSlot[]): Set<string> {
  const identities = new Set<string>();

  for (const slot of slots) {
    if (slot.isPlaceholder) continue;
    const key = playerIdentityKey({ name: slot.name, shirtNumber: slot.shirtNumber });
    if (key) identities.add(key);

    const name = normalizePlayerName(slot.name);
    if (name) identities.add(`name:${name}`);
  }

  return identities;
}

export function isStarterPlayer(
  player: { name: string; shirtNumber: number | null },
  slots: LineupSlot[]
): boolean {
  const starters = starterIdentitySet(slots);
  const key = playerIdentityKey(player);
  if (key && starters.has(key)) return true;
  const name = normalizePlayerName(player.name);
  return Boolean(name && starters.has(`name:${name}`));
}

export function dedupeBenchAgainstStarters(
  bench: LineupBenchPlayer[],
  slots: LineupSlot[]
): LineupBenchPlayer[] {
  return dedupePlayersByIdentity(bench).filter((player) => !isStarterPlayer(player, slots));
}
