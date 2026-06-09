import { getBenchPlayers, type BenchPlayer } from "@/lib/lineup/bench-players";
import type { ResolvedLineup } from "@/lib/lineup/types";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";

export function resolveBenchPlayers(
  squad: TeamSquadWithPlayers,
  lineup: ResolvedLineup
): BenchPlayer[] {
  if (lineup.bench && lineup.bench.length > 0) {
    return lineup.bench.map((player) => ({
      key: player.key,
      name: player.name,
      shirtNumber: player.shirtNumber,
      position: player.position,
      club: null,
    }));
  }

  return getBenchPlayers(squad, lineup);
}
