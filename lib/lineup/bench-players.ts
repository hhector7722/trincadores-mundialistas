import { isStarterPlayer } from "@/lib/lineup/bench-dedupe";
import { playerIdentityKey } from "@/lib/lineup/player-dedupe";
import type { ProbableXIResult } from "@/lib/lineup/types";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";

export type BenchPlayer = {
  key: string;
  name: string;
  shirtNumber: number | null;
  position: string | null;
  club: string | null;
  stickerUrl: string | null;
};

function uniqueSquadPlayers(squad: TeamSquadWithPlayers) {
  const seen = new Set<string>();
  return squad.players.filter((player) => {
    const key = playerIdentityKey({
      name: player.player_name,
      shirtNumber: player.shirt_number,
    });
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getBenchPlayers(
  squad: TeamSquadWithPlayers,
  lineup: ProbableXIResult
): BenchPlayer[] {
  return uniqueSquadPlayers(squad)
    .filter(
      (player) =>
        !isStarterPlayer(
          { name: player.player_name, shirtNumber: player.shirt_number },
          lineup.slots
        )
    )
    .map((player) => ({
      key: `${player.player_name}-${player.shirt_number ?? "x"}`,
      name: player.player_name,
      shirtNumber: player.shirt_number,
      position: player.position,
      club: player.club,
      stickerUrl: (player as any).sticker_url ?? null,
    }));
}
