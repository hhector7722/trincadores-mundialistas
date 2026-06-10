import type { OfficialSquadPlayer } from "@/lib/lineup/lineup-queries";
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

function officialToLineupInput(player: OfficialSquadPlayer): LineupPlayerInput {
  return {
    player_name: player.playerName,
    shirt_number: player.shirtNumber,
    position: player.position || null,
  };
}

function resolveOfficialLineupPlayer(
  candidate: LineupPlayerInput,
  officialSquad: OfficialSquadPlayer[]
): LineupPlayerInput | null {
  const byShirt = officialSquad.find((player) => player.shirtNumber === candidate.shirt_number);
  if (byShirt) return officialToLineupInput(byShirt);

  const normalizedCandidate = normalizeName(candidate.player_name);
  const byName = officialSquad.find(
    (player) => normalizeName(player.playerName) === normalizedCandidate
  );
  if (byName) return officialToLineupInput(byName);

  return null;
}

export type FindSquadPlayerOptions = {
  /** Evita reutilizar el mismo jugador de convocatoria en dos slots. */
  excludeIdentities?: Set<string>;
};

function findSquadPlayerLegacy(
  apiName: string,
  shirtNumber: number | null | undefined,
  players: LineupPlayerInput[],
  exclude: Set<string>
): LineupPlayerInput | null {
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

export function findSquadPlayer(
  bsdPlayer: { name: string; shirtNumber: number },
  squadPlayers: LineupPlayerInput[],
  officialSquad: OfficialSquadPlayer[],
  usedShirtNumbers: Set<number>,
  options?: FindSquadPlayerOptions
): LineupPlayerInput | null {
  const exclude = options?.excludeIdentities ?? new Set<string>();

  if (!officialSquad.length) {
    return findSquadPlayerLegacy(
      bsdPlayer.name,
      bsdPlayer.shirtNumber,
      squadPlayers,
      exclude
    );
  }

  const available = squadPlayers.filter((player) => {
    const key = squadIdentity(player);
    return key && !exclude.has(key);
  });

  let matched: LineupPlayerInput | null = null;

  const candidates = nameCandidates(bsdPlayer.name, available);
  if (candidates.length === 1) {
    matched = resolveOfficialLineupPlayer(candidates[0]!, officialSquad);
  } else if (candidates.length > 1 && bsdPlayer.shirtNumber > 0) {
    const byShirt = candidates.filter((player) => player.shirt_number === bsdPlayer.shirtNumber);
    if (byShirt.length === 1) {
      matched = resolveOfficialLineupPlayer(byShirt[0]!, officialSquad);
    }
  }

  if (!matched?.shirt_number) return null;
  if (usedShirtNumbers.has(matched.shirt_number)) return null;

  return matched;
}

export function reserveSquadPlayerIdentity(
  player: LineupPlayerInput | null,
  usedIdentities: Set<string>
): void {
  if (!player) return;
  const key = squadIdentity(player);
  if (key) usedIdentities.add(key);
}
