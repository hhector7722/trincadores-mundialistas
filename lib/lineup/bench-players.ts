import type { ProbableXIResult } from "@/lib/lineup/types";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";

export type BenchPlayer = {
  key: string;
  name: string;
  shirtNumber: number | null;
  position: string | null;
  club: string | null;
};

export function getBenchPlayers(
  squad: TeamSquadWithPlayers,
  lineup: ProbableXIResult
): BenchPlayer[] {
  const starterNames = new Set(
    lineup.slots.filter((slot) => !slot.isPlaceholder).map((slot) => slot.name.toLowerCase())
  );

  return squad.players
    .filter((player) => !starterNames.has(player.player_name.toLowerCase()))
    .map((player) => ({
      key: `${player.player_name}-${player.shirt_number ?? "x"}`,
      name: player.player_name,
      shirtNumber: player.shirt_number,
      position: player.position,
      club: player.club,
    }));
}
