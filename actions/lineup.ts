"use server";

import { getPlayerDetail, type PlayerDetail } from "@/lib/lineup/player-detail";
import {
  getTeamSquadByName,
  type TeamSquadWithPlayers,
} from "@/lib/worldcup-data/squad-queries";
import { createClient } from "@/lib/supabase/server";

export type LineupActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function fetchTeamSquadAction(
  teamName: string
): Promise<LineupActionResult<TeamSquadWithPlayers | null>> {
  try {
    const supabase = await createClient();
    const squad = await getTeamSquadByName(supabase, teamName, { year: 2026 });
    if (squad) return { ok: true, data: squad };

    const fallback = await getTeamSquadByName(supabase, teamName);
    return { ok: true, data: fallback };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar la plantilla.";
    return { ok: false, error: message };
  }
}

export async function fetchPlayerDetailAction(
  teamName: string,
  playerName: string
): Promise<LineupActionResult<PlayerDetail>> {
  try {
    const supabase = await createClient();
    const squadResult = await fetchTeamSquadAction(teamName);
    const squad = squadResult.ok ? squadResult.data : null;
    const detail = await getPlayerDetail(supabase, teamName, playerName, squad);
    return { ok: true, data: detail };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar el jugador.";
    return { ok: false, error: message };
  }
}

export async function fetchMatchSquadsAction(
  homeTeam: string,
  awayTeam: string
): Promise<
  LineupActionResult<{ home: TeamSquadWithPlayers | null; away: TeamSquadWithPlayers | null }>
> {
  const [homeResult, awayResult] = await Promise.all([
    fetchTeamSquadAction(homeTeam),
    fetchTeamSquadAction(awayTeam),
  ]);

  if (!homeResult.ok) return homeResult;
  if (!awayResult.ok) return awayResult;

  return {
    ok: true,
    data: { home: homeResult.data, away: awayResult.data },
  };
}
