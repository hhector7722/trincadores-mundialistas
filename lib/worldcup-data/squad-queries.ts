import type { SupabaseClient } from "@supabase/supabase-js";
import { WOMENS_WC_TOURNAMENT_IDS } from "@/lib/fjelstul-worldcup/normalize";
import { squadLookupNames } from "@/lib/worldcup2026/squad-team-names";
import { WC2026_SQUAD_YEAR } from "@/lib/worldcup2026/normalize-squads";
import { WC2026_FEED_SOURCE } from "@/lib/worldcup-data/types";

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
    sticker_url?: string | null;
  }>;
};

export { WC2026_SQUAD_YEAR as CURRENT_WORLD_CUP_YEAR };

type SquadQueryOpts = {
  year?: number;
  competitionCode?: string;
  sourceCode?: string;
};

async function querySquadRow(
  client: SupabaseClient,
  teamNames: string[],
  opts: SquadQueryOpts
) {
  let q = client
    .from("team_squads")
    .select("id, team_name, team_code, year, competition_code, label, source_code")
    .in("team_name", teamNames);

  for (const womenId of WOMENS_WC_TOURNAMENT_IDS) {
    q = q.neq("tournament_external_id", womenId);
  }

  if (opts.year != null) q = q.eq("year", opts.year);
  if (opts.competitionCode) q = q.eq("competition_code", opts.competitionCode);
  if (opts.sourceCode) q = q.eq("source_code", opts.sourceCode);

  const { data: squads, error } = await q
    .order("year", { ascending: false })
    .order("source_code", { ascending: true })
    .limit(1);

  if (error) throw error;
  return squads?.[0] ?? null;
}

async function loadPlayers(client: SupabaseClient, squadId: string) {
  const { data: players, error } = await client
    .from("team_squad_players")
    .select("player_name, position, shirt_number, club, status, sticker_url")
    .eq("squad_id", squadId)
    .order("shirt_number", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return players ?? [];
}

/** Consulta plantilla por nombre de selección (OpenFootball / FIFA). */
export async function getTeamSquadByName(
  client: SupabaseClient,
  teamName: string,
  opts?: SquadQueryOpts
): Promise<TeamSquadWithPlayers | null> {
  const year = opts?.year ?? WC2026_SQUAD_YEAR;
  const lookupNames = squadLookupNames(teamName);

  // Mundial actual: priorizar fuente worldcup2026, sin fallback a histórico.
  if (year === WC2026_SQUAD_YEAR && !opts?.sourceCode) {
    const wc26 = await querySquadRow(client, lookupNames, {
      year,
      sourceCode: WC2026_FEED_SOURCE,
      competitionCode: opts?.competitionCode,
    });
    if (wc26) {
      return { ...wc26, players: await loadPlayers(client, wc26.id) };
    }
    return null;
  }

  const squad = await querySquadRow(client, lookupNames, {
    year,
    sourceCode: opts?.sourceCode,
    competitionCode: opts?.competitionCode,
  });
  if (!squad) return null;

  return { ...squad, players: await loadPlayers(client, squad.id) };
}
