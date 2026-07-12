import { fetchFotmobLiveBundle } from "@/lib/live/sources/fotmob-live";
import type { AdminClient } from "@/lib/scripts/supabase-admin";

type MatchRow = {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  status: string;
};

export type SyncLiveMatchesResult = {
  scanned: number;
  updated: number;
  markedLive: number;
  markedFinished: number;
  resultsPersisted: number;
  errors: string[];
};

async function loadCandidateMatches(admin: AdminClient, nowMs: number): Promise<MatchRow[]> {
  const fromIso = new Date(nowMs - 4 * 60 * 60 * 1000).toISOString();
  const toIso = new Date(nowMs + 30 * 60 * 1000).toISOString();

  // Only load scheduled matches within the window, and any currently live matches.
  // Finished matches are handled by backfill and scores-recalc jobs.
  const [windowed, liveOngoing] = await Promise.all([
    admin
      .from("matches")
      .select("id, home_team, away_team, kickoff_at, status")
      .in("status", ["scheduled", "live"])
      .gte("kickoff_at", fromIso)
      .lte("kickoff_at", toIso),
    admin
      .from("matches")
      .select("id, home_team, away_team, kickoff_at, status")
      .eq("status", "live"),
  ]);

  if (windowed.error) throw new Error(`matches: ${windowed.error.message}`);
  if (liveOngoing.error) throw new Error(`matches live: ${liveOngoing.error.message}`);

  const byId = new Map<string, MatchRow>();
  for (const row of [...(windowed.data ?? []), ...(liveOngoing.data ?? [])]) {
    byId.set(row.id, row as MatchRow);
  }
  return [...byId.values()];
}

async function loadBsdEventMap(
  admin: AdminClient,
  matchIds: string[],
): Promise<Map<string, string>> {
  if (!matchIds.length) return new Map();

  const { data, error } = await admin
    .from("external_id_map")
    .select("internal_id, external_key")
    .in("source_code", ["fotmob", "bsd"])
    .eq("entity_type", "match")
    .eq("match_status", "mapped")
    .in("internal_id", matchIds);

  if (error) throw new Error(`external_id_map: ${error.message}`);

  return new Map((data ?? []).map((row) => [row.internal_id as string, row.external_key as string]));
}

function determineAdvancingTeam(
  homeGoals: number,
  awayGoals: number,
  penaltyHome?: number | null,
  penaltyAway?: number | null,
): "home" | "away" | null {
  if (homeGoals > awayGoals) return "home";
  if (homeGoals < awayGoals) return "away";
  if (penaltyHome != null && penaltyAway != null) {
    if (penaltyHome > penaltyAway) return "home";
    if (penaltyHome < penaltyAway) return "away";
  }
  return null;
}

async function persistOfficialResultFromLive(
  admin: AdminClient,
  matchId: string,
  homeGoals: number,
  awayGoals: number,
  penaltyHome?: number | null,
  penaltyAway?: number | null
): Promise<boolean> {
  const { data: existing } = await admin
    .from("match_results")
    .select("home_goals, away_goals, recorded_by")
    .eq("match_id", matchId)
    .maybeSingle();

  // No sobreescribir si el resultado fue introducido manualmente (recorded_by no es null)
  if (existing && existing.recorded_by !== null) {
    return false;
  }

  if (
    existing &&
    existing.home_goals === homeGoals &&
    existing.away_goals === awayGoals &&
    (existing as any).penalty_home === (penaltyHome ?? null) &&
    (existing as any).penalty_away === (penaltyAway ?? null)
  ) {
    return false;
  }

  const { error } = await admin.from("match_results").upsert(
    {
      match_id: matchId,
      home_goals: homeGoals,
      away_goals: awayGoals,
      penalty_home: penaltyHome ?? null,
      penalty_away: penaltyAway ?? null,
      advancing_team: determineAdvancingTeam(homeGoals, awayGoals, penaltyHome, penaltyAway),
      recorded_at: new Date().toISOString(),
    },
    { onConflict: "match_id" },
  );

  if (error) throw new Error(`match_results: ${error.message}`);
  return true;
}

export async function syncLiveMatches(
  admin: AdminClient,
  nowMs: number = Date.now(),
): Promise<SyncLiveMatchesResult> {
  const result: SyncLiveMatchesResult = {
    scanned: 0,
    updated: 0,
    markedLive: 0,
    markedFinished: 0,
    resultsPersisted: 0,
    errors: [],
  };

  // No necesitamos checkear isBsdConfigured
  
  const matches = await loadCandidateMatches(admin, nowMs);
  result.scanned = matches.length;
  if (!matches.length) return result;

  const eventMap = await loadBsdEventMap(
    admin,
    matches.map((match) => match.id),
  );

  // Paralelizamos las llamadas externas y escrituras a BD
  const updates = await Promise.allSettled(
    matches.map(async (match) => {
      const externalKey = eventMap.get(match.id);
      if (!externalKey) return;

      const eventId = Number(externalKey);
      if (!Number.isFinite(eventId)) return;

      const bundle = await fetchFotmobLiveBundle(eventId);
      if (!bundle) return;
      
      const isFinished = bundle.finished;

      const shouldPersist =
        bundle.isLive ||
        isFinished ||
        bundle.homeScore > 0 ||
        bundle.awayScore > 0;

      if (!shouldPersist) return;

      const { error: upsertError } = await admin.from("match_live_state").upsert(
        {
          match_id: match.id,
          source_code: bundle.sourceCode,
          source_external_key: bundle.externalKey,
          home_score: bundle.homeScore,
          away_score: bundle.awayScore,
          time_elapsed: bundle.timeElapsed,
          finished: isFinished,
          synced_at: bundle.syncedAt,
          live_payload: bundle.payload,
        },
        { onConflict: "match_id" },
      );

      if (upsertError) {
        throw new Error(`${match.id}: ${upsertError.message}`);
      }

      let markedLive = false;
      let markedFinished = false;
      let resultsPersisted = false;

      if (bundle.isLive && match.status !== "live") {
        const { error: liveError } = await admin
          .from("matches")
          .update({ status: "live" })
          .eq("id", match.id);
        if (!liveError) markedLive = true;
      }

      if (isFinished) {
        const resultWritten = await persistOfficialResultFromLive(
          admin,
          match.id,
          bundle.homeScore,
          bundle.awayScore,
          bundle.payload?.penaltyHome,
          bundle.payload?.penaltyAway
        );
        if (resultWritten) resultsPersisted = true;

        if (match.status !== "finished") {
          const { error: finishError } = await admin
            .from("matches")
            .update({ status: "finished" })
            .eq("id", match.id);
          if (!finishError) markedFinished = true;
        }
      }

      return { markedLive, markedFinished, resultsPersisted, updated: true };
    })
  );

  for (const update of updates) {
    if (update.status === "rejected") {
      result.errors.push(update.reason instanceof Error ? update.reason.message : String(update.reason));
    } else if (update.value) {
      if (update.value.updated) result.updated += 1;
      if (update.value.markedLive) result.markedLive += 1;
      if (update.value.markedFinished) result.markedFinished += 1;
      if (update.value.resultsPersisted) result.resultsPersisted += 1;
    }
  }

  return result;
}
