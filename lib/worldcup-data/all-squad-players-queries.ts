import type { SupabaseClient } from "@supabase/supabase-js";
import type { SearchablePlayer } from "@/lib/players/search-players";
import { WC2026_SQUAD_YEAR } from "@/lib/worldcup2026/normalize-squads";
import { WC2026_FEED_SOURCE } from "@/lib/worldcup-data/types";

const PAGE_SIZE = 2000;

/** Todas las convocatorias WC 2026 (fuente worldcup2026) para busqueda global. */
export async function getAllTournamentPlayers(
  client: SupabaseClient
): Promise<SearchablePlayer[]> {
  const { data: squads, error: squadsError } = await client
    .from("team_squads")
    .select("id, team_name")
    .eq("year", WC2026_SQUAD_YEAR)
    .eq("source_code", WC2026_FEED_SOURCE)
    .order("team_name", { ascending: true });

  if (squadsError) throw squadsError;
  if (!squads?.length) return [];

  const squadIds = squads.map((squad) => squad.id);
  const teamBySquadId = new Map(squads.map((squad) => [squad.id, squad.team_name]));

  const allPlayers: Array<{
    squad_id: string;
    player_name: string;
    position: string | null;
    shirt_number: number | null;
  }> = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data: page, error } = await client
      .from("team_squad_players")
      .select("squad_id, player_name, position, shirt_number")
      .in("squad_id", squadIds)
      .order("player_name", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;
    if (!page || page.length === 0) break;
    allPlayers.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return allPlayers.flatMap((row) => {
    const teamName = teamBySquadId.get(row.squad_id);
    if (!teamName) return [];
    return [
      {
        playerName: row.player_name,
        teamName,
        position: row.position,
        shirtNumber: row.shirt_number,
      },
    ];
  });
}
