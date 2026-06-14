import { loadOfficialSquadFromClient } from "@/lib/lineup/lineup-queries";
import { teamNamesMatch } from "@/lib/lineup/sources/api-football-names";
import {
  fetchFotmobMatchDetails,
  resolveFotmobMatchIdForInternalMatch,
  type FotMobLineupTeam,
  type FotMobMatchDetailsPayload,
} from "@/lib/lineup/sources/fotmob-client";
import { parseFotmobConfirmedTeamLineup } from "@/lib/lineup/sources/fotmob-lineup-parse";
import type { ConfirmedLineupProvider, LineupFetchParams } from "@/lib/lineup/sources/types";
import type { ResolvedLineup } from "@/lib/lineup/types";
import type { FotMobMatchListItem } from "@/lib/live/sources/fotmob-official-mvp";

async function loadMatchTeams(supabase: LineupFetchParams["supabase"], matchId: string) {
  const { data } = await supabase
    .from("matches")
    .select("home_team, away_team, kickoff_at")
    .eq("id", matchId)
    .maybeSingle();
  return data;
}

function pickFotmobTeamSide(
  payload: FotMobMatchDetailsPayload,
  teamName: string
): FotMobLineupTeam | null {
  const home = payload.content?.lineup?.homeTeam;
  const away = payload.content?.lineup?.awayTeam;

  if (home?.name && teamNamesMatch(home.name, teamName)) return home;
  if (away?.name && teamNamesMatch(away.name, teamName)) return away;
  return null;
}

export async function fetchConfirmedLineupFromFotmob(
  params: LineupFetchParams,
  options?: { cachedRowsByDate?: Map<string, FotMobMatchListItem[]> }
): Promise<ResolvedLineup | null> {
  const match = await loadMatchTeams(params.supabase, params.matchId);
  if (!match?.kickoff_at) return null;

  const fotmobMatchId = await resolveFotmobMatchIdForInternalMatch(
    params.supabase,
    params.matchId,
    match.home_team,
    match.away_team,
    match.kickoff_at,
    options?.cachedRowsByDate
  );
  if (!fotmobMatchId) return null;

  const details = await fetchFotmobMatchDetails(fotmobMatchId);
  if (!details?.content?.lineup) return null;

  const teamPayload = pickFotmobTeamSide(details, params.teamName);
  if (!teamPayload) return null;

  return parseFotmobConfirmedTeamLineup(
    teamPayload,
    params.players,
    new Date().toISOString(),
    await loadOfficialSquadFromClient(params.supabase, params.teamName)
  );
}

/** FotMob no requiere API key; siempre disponible para WC2026. */
export function isFotmobLineupConfigured(): boolean {
  return true;
}

export const fotmobConfirmedProvider: ConfirmedLineupProvider = {
  code: "fotmob",
  fetchConfirmedLineup: fetchConfirmedLineupFromFotmob,
};
