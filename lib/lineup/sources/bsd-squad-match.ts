import type { OfficialSquadPlayer } from "@/lib/lineup/lineup-queries";
import { playerIdentityKey } from "@/lib/lineup/player-dedupe";
import type { LineupPlayerInput } from "@/lib/lineup/types";

const FIFA_SQUAD_SHIRT_MAX = 26;

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

/** ¿BSD y convocatoria FIFA se refieren al mismo jugador? (fuzzy, no exacto) */
export function namesReferToSamePlayer(apiName: string, officialName: string): boolean {
  const left = normalizeName(apiName);
  const right = normalizeName(officialName);
  if (!left || !right) return false;
  if (left === right) return true;

  const probe: LineupPlayerInput = {
    player_name: officialName,
    shirt_number: null,
    position: null,
  };
  return nameCandidates(apiName, [probe]).length === 1;
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
    if (byFirstAndLast.length === 1) return byFirstAndLast;
    if (byFirstAndLast.length > 1) return [];
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
  const normalizedCandidate = normalizeName(candidate.player_name);
  const byName = officialSquad.find(
    (player) => normalizeName(player.playerName) === normalizedCandidate
  );
  if (byName) return officialToLineupInput(byName);

  const byShirt =
    candidate.shirt_number != null
      ? officialSquad.find((player) => player.shirtNumber === candidate.shirt_number)
      : undefined;
  if (byShirt) return officialToLineupInput(byShirt);

  return null;
}

function filterAvailable(
  players: LineupPlayerInput[],
  exclude: Set<string>
): LineupPlayerInput[] {
  return players.filter((player) => {
    const key = squadIdentity(player);
    return key && !exclude.has(key);
  });
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
  const candidates = nameCandidates(apiName, filterAvailable(players, exclude));
  if (candidates.length === 1) return candidates[0]!;

  if (candidates.length > 1 && shirtNumber != null) {
    const byShirt = candidates.filter((player) => player.shirt_number === shirtNumber);
    if (byShirt.length === 1) return byShirt[0]!;
  }

  return null;
}

/**
 * Empareja BSD → jugador oficial por nombre fuzzy.
 * Dorsal solo confirma identidad si el titular FIFA de ese dorsal es el mismo jugador (no sustituye por número).
 */
export function findOfficialSquadMatch(
  bsdPlayer: { name: string; shirtNumber: number },
  squadPlayers: LineupPlayerInput[],
  officialSquad: OfficialSquadPlayer[],
  options?: FindSquadPlayerOptions
): LineupPlayerInput | null {
  const exclude = options?.excludeIdentities ?? new Set<string>();
  const available = filterAvailable(squadPlayers, exclude);
  const officialLineup = officialSquad.map(officialToLineupInput);
  const officialAvailable = filterAvailable(officialLineup, exclude);

  let matched: LineupPlayerInput | null = null;

  let candidates = nameCandidates(bsdPlayer.name, available);
  if (candidates.length === 0) {
    candidates = nameCandidates(bsdPlayer.name, officialAvailable);
  }

  if (candidates.length === 1) {
    matched = resolveOfficialLineupPlayer(candidates[0]!, officialSquad);
  } else if (candidates.length > 1 && bsdPlayer.shirtNumber > 0) {
    const byShirt = candidates.filter((player) => player.shirt_number === bsdPlayer.shirtNumber);
    if (byShirt.length === 1) {
      matched = resolveOfficialLineupPlayer(byShirt[0]!, officialSquad);
    }
  }

  if (!matched && bsdPlayer.shirtNumber > 0) {
    const holder = officialSquad.find((player) => player.shirtNumber === bsdPlayer.shirtNumber);
    if (holder && namesReferToSamePlayer(bsdPlayer.name, holder.playerName)) {
      const lineup = officialToLineupInput(holder);
      const key = squadIdentity(lineup);
      if (key && !exclude.has(key)) {
        matched = lineup;
      }
    }
  }

  return matched?.shirt_number ? matched : null;
}

export function findSquadPlayer(
  bsdPlayer: { name: string; shirtNumber: number },
  squadPlayers: LineupPlayerInput[],
  officialSquad: OfficialSquadPlayer[],
  usedShirtNumbers: Set<number>,
  options?: FindSquadPlayerOptions
): LineupPlayerInput | null {
  if (!officialSquad.length) {
    return findSquadPlayerLegacy(
      bsdPlayer.name,
      bsdPlayer.shirtNumber,
      squadPlayers,
      options?.excludeIdentities ?? new Set<string>()
    );
  }

  const matched = findOfficialSquadMatch(bsdPlayer, squadPlayers, officialSquad, options);
  if (!matched?.shirt_number) return null;
  if (usedShirtNumbers.has(matched.shirt_number)) return null;
  return matched;
}

export type StarterShirtInput = {
  official: LineupPlayerInput | null;
  bsdJersey: number;
};

/**
 * Asigna dorsales sin dejar camisetas vacías:
 * 1) dorsal FIFA si hubo match por nombre,
 * 2) dorsal BSD del predictor para ese slot (sin robar identidad ajena),
 * 3) primer dorsal libre 1–26.
 */
export function assignStarterShirtNumbers(
  rows: StarterShirtInput[],
  useOfficial: boolean
): number[] {
  if (!useOfficial) {
    return rows.map((row) => (row.bsdJersey > 0 ? row.bsdJersey : 1));
  }

  const shirts: Array<number | null> = rows.map(() => null);
  const used = new Set<number>();

  for (let i = 0; i < rows.length; i++) {
    const official = rows[i]!.official?.shirt_number;
    if (official && official > 0 && !used.has(official)) {
      shirts[i] = official;
      used.add(official);
    }
  }

  for (let i = 0; i < rows.length; i++) {
    if (shirts[i] != null) continue;
    const bsd = rows[i]!.bsdJersey;
    if (bsd > 0 && !used.has(bsd)) {
      shirts[i] = bsd;
      used.add(bsd);
    }
  }

  for (let i = 0; i < rows.length; i++) {
    if (shirts[i] != null) continue;
    for (let n = 1; n <= FIFA_SQUAD_SHIRT_MAX; n++) {
      if (!used.has(n)) {
        shirts[i] = n;
        used.add(n);
        break;
      }
    }
    if (shirts[i] == null) {
      const fallback = rows[i]!.bsdJersey > 0 ? rows[i]!.bsdJersey : FIFA_SQUAD_SHIRT_MAX;
      shirts[i] = fallback;
      used.add(fallback);
    }
  }

  return shirts as number[];
}

export function reserveSquadPlayerIdentity(
  player: LineupPlayerInput | null,
  usedIdentities: Set<string>
): void {
  if (!player) return;
  const key = squadIdentity(player);
  if (key) usedIdentities.add(key);
}
