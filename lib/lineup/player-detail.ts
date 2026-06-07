import type { SupabaseClient } from "@supabase/supabase-js";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";

export type PlayerDetail = {
  playerName: string;
  teamName: string;
  position: string | null;
  shirtNumber: number | null;
  club: string | null;
  status: string | null;
  worldCupGoals: number;
  goldenBoot: boolean;
  bestYoungPlayer: boolean;
};

export async function getPlayerDetail(
  client: SupabaseClient,
  teamName: string,
  playerName: string,
  squad: TeamSquadWithPlayers | null
): Promise<PlayerDetail> {
  const squadPlayer =
    squad?.players.find(
      (p) => p.player_name.toLowerCase() === playerName.trim().toLowerCase()
    ) ?? null;

  const normalizedName = playerName.trim();

  const { count: goalsCount } = await client
    .from("wc_historic_goals")
    .select("id", { count: "exact", head: true })
    .ilike("player_name", normalizedName);

  const { data: awards } = await client
    .from("wc_historic_award_winners")
    .select("award_name")
    .ilike("player_name", normalizedName);

  const awardNames = new Set((awards ?? []).map((a) => a.award_name.toLowerCase()));

  return {
    playerName: squadPlayer?.player_name ?? normalizedName,
    teamName,
    position: squadPlayer?.position ?? null,
    shirtNumber: squadPlayer?.shirt_number ?? null,
    club: squadPlayer?.club ?? null,
    status: squadPlayer?.status ?? null,
    worldCupGoals: goalsCount ?? 0,
    goldenBoot: awardNames.has("golden boot") || awardNames.has("golden boot award"),
    bestYoungPlayer:
      awardNames.has("best young player") || awardNames.has("best young player award"),
  };
}
