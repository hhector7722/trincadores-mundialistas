import type { OfficialSquadPlayer } from "@/lib/lineup/lineup-queries";
import { positionLabelEs, normalizePositionRole } from "@/lib/lineup/position-map";
import {
  officialToLineupInput,
  reserveSquadPlayerIdentity,
} from "@/lib/lineup/sources/bsd-squad-match";
import type { LineupPlayerInput, PositionRole } from "@/lib/lineup/types";
import { playerIdentityKey } from "@/lib/lineup/player-dedupe";

export type StarterSlotDraft = {
  slotKey: string;
  role: PositionRole;
  key: string;
  name: string;
  shirtNumber: number | null;
  positionLabel: string;
  isPlaceholder: boolean;
};

function sortByShirt(a: LineupPlayerInput, b: LineupPlayerInput): number {
  const na = a.shirt_number ?? 999;
  const nb = b.shirt_number ?? 999;
  return na - nb;
}

function filterAvailablePool(
  players: LineupPlayerInput[],
  exclude: Set<string>
): LineupPlayerInput[] {
  return players.filter((player) => {
    const key = playerIdentityKey({
      name: player.player_name,
      shirtNumber: player.shirt_number,
    });
    return key && !exclude.has(key);
  });
}

function pickBenchPlayerForRole(
  pool: LineupPlayerInput[],
  role: PositionRole
): LineupPlayerInput | null {
  const candidates = pool
    .filter((player) => normalizePositionRole(player.position) === role)
    .sort(sortByShirt);
  return candidates[0] ?? null;
}

/**
 * Rellena titulares sin match oficial con suplentes de convocatoria por rol táctico.
 * Solo actúa cuando hay plantilla FIFA cargada.
 */
export function fillUnmatchedStarterSlotsFromSquad(
  starters: StarterSlotDraft[],
  officialSquad: OfficialSquadPlayer[],
  usedIdentities: Set<string>,
  usedShirtNumbers: Set<number>
): StarterSlotDraft[] {
  if (!officialSquad.length) return starters;

  const pool = filterAvailablePool(officialSquad.map(officialToLineupInput), usedIdentities);

  return starters.map((starter) => {
    if (starter.shirtNumber != null && starter.shirtNumber > 0 && !starter.isPlaceholder) {
      return starter;
    }

    const pick = pickBenchPlayerForRole(pool, starter.role);
    if (!pick?.shirt_number) {
      return {
        ...starter,
        name: "Por confirmar",
        shirtNumber: null,
        isPlaceholder: true,
      };
    }

    const pickIndex = pool.indexOf(pick);
    if (pickIndex >= 0) pool.splice(pickIndex, 1);
    reserveSquadPlayerIdentity(pick, usedIdentities);
    usedShirtNumbers.add(pick.shirt_number);

    return {
      ...starter,
      name: pick.player_name,
      shirtNumber: pick.shirt_number,
      positionLabel: positionLabelEs(starter.role, pick.position),
      isPlaceholder: false,
    };
  });
}
