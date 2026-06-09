import { dedupePlayersByIdentity, playerIdentityKey } from "@/lib/lineup/player-dedupe";
import { getBenchPlayers, type BenchPlayer } from "@/lib/lineup/bench-players";
import type { ResolvedLineup } from "@/lib/lineup/types";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";

function toBenchPlayer(player: {
  key: string;
  name: string;
  shirtNumber: number | null;
  position: string | null;
  club?: string | null;
}): BenchPlayer {
  return {
    key: player.key,
    name: player.name,
    shirtNumber: player.shirtNumber,
    position: player.position,
    club: player.club ?? null,
  };
}

/**
 * Convocatoria visible = plantilla FIFA menos titulares.
 * Los suplentes BSD solo reordenan la lista (prioridad al inicio).
 */
export function resolveBenchPlayers(
  squad: TeamSquadWithPlayers,
  lineup: ResolvedLineup
): BenchPlayer[] {
  const squadBench = dedupePlayersByIdentity(getBenchPlayers(squad, lineup));

  if (!lineup.bench || lineup.bench.length === 0) {
    return squadBench;
  }

  const preferredOrder = dedupePlayersByIdentity(
    lineup.bench.map((player) => ({
      name: player.name,
      shirtNumber: player.shirtNumber,
    }))
  ).map((player) => playerIdentityKey(player));

  const byIdentity = new Map(squadBench.map((player) => [playerIdentityKey(player), player]));

  const ordered: BenchPlayer[] = [];
  const used = new Set<string>();

  for (const key of preferredOrder) {
    if (!key || used.has(key)) continue;
    const player = byIdentity.get(key);
    if (!player) continue;
    ordered.push(player);
    used.add(key);
  }

  for (const player of squadBench) {
    const key = playerIdentityKey(player);
    if (!key || used.has(key)) continue;
    ordered.push(player);
    used.add(key);
  }

  return ordered;
}
