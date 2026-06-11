import { fetchOfficialMvpFromBsd } from "@/lib/live/sources/bsd-official-mvp";
import {
  fetchOfficialMvpFromFotmob,
  fetchOfficialMvpFromFotmobByTeams,
  loadFotmobMatchesForDate,
  type FotMobMatchListItem,
} from "@/lib/live/sources/fotmob-official-mvp";
import {
  fetchOfficialMvpFromFifa,
  loadFifaCalendarLookup,
  resolveFifaMatchFromCalendar,
  type FifaResolvedMatch,
} from "@/lib/live/sources/fifa-official-mvp";
import type { SyncLiveMatchesResult } from "@/lib/live/sync-live-matches";
import type { AdminClient } from "@/lib/scripts/supabase-admin";

type MatchMvpCandidate = {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  status: string;
};

export async function loadMatchesMissingOfficialMvp(
  admin: AdminClient,
  nowMs: number,
): Promise<MatchMvpCandidate[]> {
  const fromIso = new Date(nowMs - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, status, match_results!inner(mvp_player_name)")
    .eq("status", "finished")
    .gte("kickoff_at", fromIso)
    .is("match_results.mvp_player_name", null);

  if (error) throw new Error(`matches missing mvp: ${error.message}`);
  return (data ?? []) as MatchMvpCandidate[];
}

function kickoffDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

async function loadBsdEventMap(
  admin: AdminClient,
  matchIds: string[],
): Promise<Map<string, string>> {
  if (!matchIds.length) return new Map();

  const { data, error } = await admin
    .from("external_id_map")
    .select("internal_id, external_key")
    .eq("source_code", "bsd")
    .eq("entity_type", "match")
    .eq("match_status", "mapped")
    .in("internal_id", matchIds);

  if (error) throw new Error(`external_id_map bsd: ${error.message}`);

  return new Map((data ?? []).map((row) => [row.internal_id as string, row.external_key as string]));
}

async function loadFotmobEventMap(
  admin: AdminClient,
  matchIds: string[],
): Promise<Map<string, string>> {
  if (!matchIds.length) return new Map();

  const { data, error } = await admin
    .from("external_id_map")
    .select("internal_id, external_key")
    .eq("source_code", "fotmob")
    .eq("entity_type", "match")
    .eq("match_status", "mapped")
    .in("internal_id", matchIds);

  if (error) throw new Error(`external_id_map fotmob: ${error.message}`);

  return new Map((data ?? []).map((row) => [row.internal_id as string, row.external_key as string]));
}

async function loadPoolIdForMatch(admin: AdminClient, matchId: string): Promise<string | null> {
  const { data, error } = await admin
    .from("matches")
    .select("matchdays!inner(pool_id)")
    .eq("id", matchId)
    .maybeSingle();

  if (error || !data) return null;

  const matchdays = (data as { matchdays: { pool_id: string } | { pool_id: string }[] }).matchdays;
  if (Array.isArray(matchdays)) return matchdays[0]?.pool_id ?? null;
  return matchdays.pool_id ?? null;
}

async function persistOfficialMvp(
  admin: AdminClient,
  matchId: string,
  playerName: string,
  teamName: string,
): Promise<boolean> {
  const { data: existing } = await admin
    .from("match_results")
    .select("mvp_player_name")
    .eq("match_id", matchId)
    .maybeSingle();

  if (!existing || existing.mvp_player_name) return false;

  const { error } = await admin
    .from("match_results")
    .update({
      mvp_player_name: playerName,
      mvp_team_name: teamName,
      recorded_at: new Date().toISOString(),
    })
    .eq("match_id", matchId);

  if (error) throw new Error(`match_results mvp: ${error.message}`);
  return true;
}

/** Prioridad: FotMob → FIFA → BSD (solo señales explícitas, sin inferir por rating). */
async function resolveOfficialMvp(
  match: MatchMvpCandidate,
  fifaLookup: Map<string, FifaResolvedMatch>,
  fotmobEventId: string | undefined,
  fotmobByDate: Map<string, FotMobMatchListItem[]>,
  bsdEventId: string | undefined,
): Promise<{ playerName: string; teamName: string } | null> {
  if (fotmobEventId) {
    const fotmobId = Number(fotmobEventId);
    if (Number.isFinite(fotmobId)) {
      const fotmobMvp = await fetchOfficialMvpFromFotmob(fotmobId, match.home_team);
      if (fotmobMvp) {
        return { playerName: fotmobMvp.playerName, teamName: fotmobMvp.teamName };
      }
    }
  }

  const dateKey = kickoffDateKey(match.kickoff_at);
  if (dateKey) {
    let rows = fotmobByDate.get(dateKey);
    if (!rows) {
      rows = await loadFotmobMatchesForDate(dateKey);
      fotmobByDate.set(dateKey, rows);
    }

    const fotmobMvp = await fetchOfficialMvpFromFotmobByTeams(
      match.home_team,
      match.away_team,
      match.kickoff_at,
      rows,
    );
    if (fotmobMvp) {
      return { playerName: fotmobMvp.playerName, teamName: fotmobMvp.teamName };
    }
  }

  const fifaMatch = resolveFifaMatchFromCalendar(
    fifaLookup,
    match.home_team,
    match.away_team,
    match.kickoff_at,
  );

  if (fifaMatch) {
    const fifaMvp = await fetchOfficialMvpFromFifa(fifaMatch, match.home_team, match.away_team);
    if (fifaMvp) {
      return { playerName: fifaMvp.playerName, teamName: fifaMvp.teamName };
    }
  }

  if (bsdEventId) {
    const eventId = Number(bsdEventId);
    if (Number.isFinite(eventId)) {
      const bsdMvp = await fetchOfficialMvpFromBsd(eventId, match.home_team, match.away_team);
      if (bsdMvp) {
        return { playerName: bsdMvp.playerName, teamName: bsdMvp.teamName };
      }
    }
  }

  return null;
}

export async function syncOfficialMvps(
  admin: AdminClient,
  result: SyncLiveMatchesResult,
  poolsToRebuild: Set<string>,
  nowMs: number = Date.now(),
  prefetchedMatches?: MatchMvpCandidate[],
): Promise<void> {
  const matches = prefetchedMatches ?? (await loadMatchesMissingOfficialMvp(admin, nowMs));
  if (!matches.length) return;

  const fifaLookup = await loadFifaCalendarLookup();
  const matchIds = matches.map((match) => match.id);
  const [bsdMap, fotmobMap] = await Promise.all([
    loadBsdEventMap(admin, matchIds),
    loadFotmobEventMap(admin, matchIds),
  ]);
  const fotmobByDate = new Map<string, FotMobMatchListItem[]>();

  for (const match of matches) {
    try {
      const official = await resolveOfficialMvp(
        match,
        fifaLookup,
        fotmobMap.get(match.id),
        fotmobByDate,
        bsdMap.get(match.id),
      );
      if (!official) continue;

      const written = await persistOfficialMvp(
        admin,
        match.id,
        official.playerName,
        official.teamName,
      );
      if (!written) continue;

      result.mvpsPersisted += 1;

      const { error: recalcError } = await admin.rpc("recalculate_match_scores", {
        p_match_id: match.id,
      });
      if (recalcError) {
        result.errors.push(`${match.id}/mvp-recalc: ${recalcError.message}`);
        continue;
      }
      result.scoresRecalculated += 1;

      const poolId = await loadPoolIdForMatch(admin, match.id);
      if (poolId) poolsToRebuild.add(poolId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "sync official mvp";
      result.errors.push(`${match.id}/mvp: ${message}`);
    }
  }
}
