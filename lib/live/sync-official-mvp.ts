import { fetchOfficialMvpFromBsd } from "@/lib/live/sources/bsd-official-mvp";
import { fetchOfficialMvpFromFifaMatchReport } from "@/lib/live/sources/fifa-match-report-mvp";
import { fetchOfficialMvpFromFotmob } from "@/lib/live/sources/fotmob-official-mvp";
import {
  fetchOfficialMvpFromFifa,
  loadFifaCalendarLookup,
  resolveFifaMatchFromCalendar,
  type FifaResolvedMatch,
} from "@/lib/live/sources/fifa-official-mvp";
import {
  mvpPlayerNamesMatch,
  mvpTeamsMatch,
} from "@/lib/predictions/mvp-name-match";
import { resolveOfficialMvpToSquad } from "@/lib/predictions/resolve-official-mvp-squad";
export type SyncMvpResult = {
  mvpsPersisted: number;
  scoresRecalculated: number;
  errors: string[];
};
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

export async function loadBsdEventMap(
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

export async function loadFotmobEventMap(
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

async function loadFinishedMatchesWithOfficialMvp(
  admin: AdminClient,
  nowMs: number,
): Promise<MatchMvpCandidate[]> {
  const fromIso = new Date(nowMs - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, status, match_results!inner(mvp_player_name)")
    .eq("status", "finished")
    .gte("kickoff_at", fromIso)
    .not("match_results.mvp_player_name", "is", null);

  if (error) throw new Error(`matches with mvp: ${error.message}`);
  return (data ?? []) as MatchMvpCandidate[];
}

function officialMvpMatchesStored(
  official: { playerName: string; teamName: string },
  storedPlayer: string,
  storedTeam: string,
): boolean {
  return (
    mvpPlayerNamesMatch(official.playerName, storedPlayer) &&
    mvpTeamsMatch(official.teamName, storedTeam)
  );
}

async function loadPredictedMvpPlayerNames(
  admin: AdminClient,
  matchId: string,
): Promise<string[]> {
  const { data, error } = await admin
    .from("match_mvp_predictions")
    .select("player_name")
    .eq("match_id", matchId);

  if (error) throw new Error(`match_mvp_predictions names: ${error.message}`);

  return [
    ...new Set(
      (data ?? [])
        .map((row) => row.player_name?.trim())
        .filter((name): name is string => Boolean(name)),
    ),
  ];
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
  options?: { overwrite?: boolean },
): Promise<"written" | "unchanged" | "skipped"> {
  const { data: existing } = await admin
    .from("match_results")
    .select("mvp_player_name, mvp_team_name")
    .eq("match_id", matchId)
    .maybeSingle();

  if (!existing) return "skipped";

  if (existing.mvp_player_name) {
    if (
      !options?.overwrite ||
      officialMvpMatchesStored(
        { playerName, teamName },
        existing.mvp_player_name,
        existing.mvp_team_name ?? "",
      )
    ) {
      return "unchanged";
    }
  }

  const { error } = await admin
    .from("match_results")
    .update({
      mvp_player_name: playerName,
      mvp_team_name: teamName,
      recorded_at: new Date().toISOString(),
    })
    .eq("match_id", matchId);

  if (error) throw new Error(`match_results mvp: ${error.message}`);
  return "written";
}

type ResolvedOfficialMvp = {
  playerName: string;
  teamName: string;
  fifaPlayerId?: string;
  shirtNumber?: number;
};

/** Prioridad: crónica FIFA.com → api.fifa.com → BSD. FotMob excluido (nota, no POTM FIFA). */
export async function resolveOfficialMvp(
  match: MatchMvpCandidate,
  fifaLookup: Map<string, FifaResolvedMatch>,
  bsdEventId: string | undefined,
): Promise<ResolvedOfficialMvp | null> {
  const fifaMatch = resolveFifaMatchFromCalendar(
    fifaLookup,
    match.home_team,
    match.away_team,
    match.kickoff_at,
  );

  const reportMvp = await fetchOfficialMvpFromFifaMatchReport(
    match.home_team,
    match.away_team,
    { idMatch: fifaMatch?.idMatch },
  );
  if (reportMvp) {
    return { playerName: reportMvp.playerName, teamName: reportMvp.teamName };
  }

  if (fifaMatch) {
    const fifaMvp = await fetchOfficialMvpFromFifa(fifaMatch, match.home_team, match.away_team);
    if (fifaMvp) {
      return {
        playerName: fifaMvp.playerName,
        teamName: fifaMvp.teamName,
        fifaPlayerId: fifaMvp.fifaPlayerId,
      };
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

async function applyOfficialMvp(
  admin: AdminClient,
  match: MatchMvpCandidate,
  official: ResolvedOfficialMvp,
  result: SyncMvpResult,
  poolsToRebuild: Set<string>,
  options?: { overwrite?: boolean },
): Promise<void> {
  const predictedNames = await loadPredictedMvpPlayerNames(admin, match.id);
  const resolved = await resolveOfficialMvpToSquad(admin, official, predictedNames);

  const outcome = await persistOfficialMvp(
    admin,
    match.id,
    resolved.playerName,
    resolved.teamName,
    options,
  );
  if (outcome !== "written") return;

  result.mvpsPersisted += 1;

  const { error: recalcError } = await admin.rpc("recalculate_match_scores", {
    p_match_id: match.id,
  });
  if (recalcError) {
    result.errors.push(`${match.id}/mvp-recalc: ${recalcError.message}`);
    return;
  }
  result.scoresRecalculated += 1;

  const poolId = await loadPoolIdForMatch(admin, match.id);
  if (poolId) poolsToRebuild.add(poolId);
}

export async function syncOfficialMvps(
  admin: AdminClient,
  result: SyncMvpResult,
  poolsToRebuild: Set<string>,
  nowMs: number = Date.now(),
  prefetchedMatches?: MatchMvpCandidate[],
): Promise<void> {
  const [missing, stored] = await Promise.all([
    prefetchedMatches ? Promise.resolve(prefetchedMatches) : loadMatchesMissingOfficialMvp(admin, nowMs),
    loadFinishedMatchesWithOfficialMvp(admin, nowMs),
  ]);

  const matches = [...missing, ...stored];
  if (!matches.length) return;

  const fifaLookup = await loadFifaCalendarLookup();
  const matchIds = [...new Set(matches.map((match) => match.id))];
  const bsdMap = await loadBsdEventMap(admin, matchIds);
  const fotmobMap = await loadFotmobEventMap(admin, matchIds);
  const missingIds = new Set(missing.map((match) => match.id));

  for (const match of matches) {
    try {
      let official = await resolveOfficialMvp(match, fifaLookup, bsdMap.get(match.id));

      if (!official) {
        const fotmobId = fotmobMap.get(match.id);
        if (fotmobId) {
          const fotmobMvp = await fetchOfficialMvpFromFotmob(Number(fotmobId), match.home_team);
          if (fotmobMvp) {
            official = { playerName: fotmobMvp.playerName, teamName: fotmobMvp.teamName };
          }
        }
      }

      if (!official) continue;

      await applyOfficialMvp(admin, match, official, result, poolsToRebuild, {
        overwrite: !missingIds.has(match.id),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "sync official mvp";
      result.errors.push(`${match.id}/mvp: ${message}`);
    }
  }
}

/** Corrección manual cuando FIFA/operación confirman el MVP antes de que la API lo publique. */
export async function correctOfficialMvpForMatch(
  admin: AdminClient,
  matchId: string,
  playerName: string,
  teamName: string,
): Promise<{ ok: true; poolIds: string[] } | { ok: false; error: string }> {
  const { data: match, error: matchError } = await admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, status")
    .eq("id", matchId)
    .maybeSingle();

  if (matchError || !match) {
    return { ok: false, error: matchError?.message ?? "Partido no encontrado." };
  }

  const result: SyncMvpResult = {
    mvpsPersisted: 0,
    scoresRecalculated: 0,
    errors: [],
  };
  const poolsToRebuild = new Set<string>();

  try {
    await applyOfficialMvp(
      admin,
      match as MatchMvpCandidate,
      { playerName, teamName },
      result,
      poolsToRebuild,
      { overwrite: true },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "correct official mvp";
    return { ok: false, error: message };
  }

  if (result.errors.length) {
    return { ok: false, error: result.errors.join("; ") };
  }
  if (result.mvpsPersisted === 0) {
    return { ok: false, error: "El MVP ya coincide con el valor indicado." };
  }

  for (const poolId of poolsToRebuild) {
    const { error: rebuildError } = await admin.rpc("rebuild_pool_member_scores", {
      p_pool_id: poolId,
    });
    if (rebuildError) {
      return { ok: false, error: rebuildError.message };
    }
  }

  return { ok: true, poolIds: [...poolsToRebuild] };
}
