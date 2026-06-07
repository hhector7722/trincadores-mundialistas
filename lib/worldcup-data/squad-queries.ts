import type { SupabaseClient } from "@supabase/supabase-js";
import { WOMENS_WC_TOURNAMENT_IDS } from "@/lib/fjelstul-worldcup/normalize";

export type TeamSquadWithPlayers = {
  id: string;
  team_name: string;
  team_code: string | null;
  year: number | null;
  competition_code: string | null;
  label: string | null;
  source_code: string;
  players: Array<{
    player_name: string;
    position: string | null;
    shirt_number: number | null;
    club: string | null;
    status: string;
  }>;
};

/** Consulta plantilla por nombre de selección (ej. "Spain", "España", "Argentina"). */
export async function getTeamSquadByName(
  client: SupabaseClient,
  teamName: string,
  opts?: { year?: number; competitionCode?: string }
): Promise<TeamSquadWithPlayers | null> {
  let q = client
    .from("team_squads")
    .select("id, team_name, team_code, year, competition_code, label, source_code")
    .ilike("team_name", teamName.trim());

  for (const womenId of WOMENS_WC_TOURNAMENT_IDS) {
    q = q.neq("tournament_external_id", womenId);
  }

  if (opts?.year) q = q.eq("year", opts.year);
  if (opts?.competitionCode) q = q.eq("competition_code", opts.competitionCode);

  const { data: squads, error } = await q.order("year", { ascending: false }).limit(1);
  if (error) throw error;
  const squad = squads?.[0];
  if (!squad) return null;

  const { data: players, error: pErr } = await client
    .from("team_squad_players")
    .select("player_name, position, shirt_number, club, status")
    .eq("squad_id", squad.id)
    .order("shirt_number", { ascending: true, nullsFirst: false });
  if (pErr) throw pErr;

  return { ...squad, players: players ?? [] };
}
