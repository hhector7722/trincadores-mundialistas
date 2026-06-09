"use server";

import { buildFallbackLineup } from "@/lib/lineup/build-fallback-lineup";
import { getPlayerDetail, type PlayerDetail } from "@/lib/lineup/player-detail";
import { resolveMatchLineups, resolveTeamLineup } from "@/lib/lineup/resolve-lineup";
import type { FormationId, ResolvedLineup } from "@/lib/lineup/types";
import { loadTeamKitHexBySlug } from "@/lib/lineup/team-kit-queries";
import type { SearchablePlayer } from "@/lib/players/search-players";
import { getAllTournamentPlayers } from "@/lib/worldcup-data/all-squad-players-queries";
import {
  getTeamSquadByName,
  type TeamSquadWithPlayers,
} from "@/lib/worldcup-data/squad-queries";
import { createClient } from "@/lib/supabase/server";

export type LineupActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function fetchAllTournamentPlayersAction(): Promise<
  LineupActionResult<SearchablePlayer[]>
> {
  try {
    const supabase = await createClient();
    const players = await getAllTournamentPlayers(supabase);
    return { ok: true, data: players };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudieron cargar los jugadores.";
    return { ok: false, error: message };
  }
}

export async function fetchTeamSquadAction(
  teamName: string
): Promise<LineupActionResult<TeamSquadWithPlayers | null>> {
  try {
    const supabase = await createClient();
    const squad = await getTeamSquadByName(supabase, teamName);
    return { ok: true, data: squad };
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

export async function fetchTeamKitHexMapAction(): Promise<
  LineupActionResult<Record<string, string>>
> {
  try {
    const supabase = await createClient();
    const map = await loadTeamKitHexBySlug(supabase);
    return { ok: true, data: map };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudieron cargar los colores de camiseta.";
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

export async function fetchResolvedTeamLineupAction(
  teamName: string,
  options?: { matchId?: string; formation?: FormationId }
): Promise<LineupActionResult<ResolvedLineup>> {
  try {
    const supabase = await createClient();
    const squad = await getTeamSquadByName(supabase, teamName);

    if (!squad || squad.players.length === 0) {
      return { ok: true, data: buildFallbackLineup([], options?.formation) };
    }

    const lineup = await resolveTeamLineup(supabase, {
      matchId: options?.matchId,
      teamName,
      players: squad.players,
      formationOverride: options?.formation,
    });

    return { ok: true, data: lineup };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo resolver la alineación.";
    return { ok: false, error: message };
  }
}

export async function fetchResolvedMatchLineupsAction(
  matchId: string,
  homeTeam: string,
  awayTeam: string
): Promise<LineupActionResult<{ home: ResolvedLineup; away: ResolvedLineup }>> {
  try {
    const supabase = await createClient();
    const [homeSquad, awaySquad] = await Promise.all([
      getTeamSquadByName(supabase, homeTeam),
      getTeamSquadByName(supabase, awayTeam),
    ]);

    const lineups = await resolveMatchLineups(
      supabase,
      matchId,
      homeTeam,
      awayTeam,
      homeSquad?.players ?? [],
      awaySquad?.players ?? []
    );

    return { ok: true, data: lineups };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudieron resolver las alineaciones.";
    return { ok: false, error: message };
  }
}
