import { playerIdentityKey } from "@/lib/lineup/player-dedupe";
import type { LineupPlayerInput } from "@/lib/lineup/types";

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function squadIdentity(player: LineupPlayerInput): string {
  return playerIdentityKey({
    name: player.player_name,
    shirtNumber: player.shirt_number,
  });
}

function sharesFirstToken(apiFirst: string, squadName: string): boolean {
  const first = apiFirst.trim();
  if (!first) return false;
  const parts = normalizeName(squadName).split(" ").filter(Boolean);
  if (parts.length === 0) return false;
  const prefix = first.slice(0, Math.min(3, first.length));
  return parts[0] === first || parts.some((part) => part.startsWith(prefix));
}

function nameCandidates(apiName: string, players: LineupPlayerInput[]): LineupPlayerInput[] {
  const target = normalizeName(apiName);
  if (!target) return [];

  const exact = players.filter((player) => normalizeName(player.player_name) === target);
  if (exact.length > 0) return exact;

  const tokens = target.split(" ").filter(Boolean);
  const last = tokens[tokens.length - 1];
  if (!last || last.length < 3) return [];

  const byLast = players.filter((player) => {
    const norm = normalizeName(player.player_name);
    return norm === last || norm.endsWith(` ${last}`) || norm.split(" ").includes(last);
  });

  if (tokens.length >= 2) {
    const first = tokens[0]!;
    const byFirstAndLast = byLast.filter((player) => sharesFirstToken(first, player.player_name));
    if (byFirstAndLast.length > 0) return byFirstAndLast;
    return [];
  }

  return byLast.length === 1 ? byLast : [];
}

export type FindSquadPlayerOptions = {
  /** Evita reutilizar el mismo jugador de convocatoria en dos slots. */
  excludeIdentities?: Set<string>;
};

export function findSquadPlayer(
  apiName: string,
  shirtNumber: number | null | undefined,
  players: LineupPlayerInput[],
  options?: FindSquadPlayerOptions
): LineupPlayerInput | null {
  const exclude = options?.excludeIdentities ?? new Set<string>();
  const available = players.filter((player) => {
    const key = squadIdentity(player);
    return key && !exclude.has(key);
  });

  const candidates = nameCandidates(apiName, available);
  if (candidates.length === 1) return candidates[0]!;

  if (candidates.length > 1 && shirtNumber != null) {
    const byShirt = candidates.filter((player) => player.shirt_number === shirtNumber);
    if (byShirt.length === 1) return byShirt[0]!;
  }

  return null;
}

export function reserveSquadPlayerIdentity(
  player: LineupPlayerInput | null,
  usedIdentities: Set<string>
): void {
  if (!player) return;
  const key = squadIdentity(player);
  if (key) usedIdentities.add(key);
}
