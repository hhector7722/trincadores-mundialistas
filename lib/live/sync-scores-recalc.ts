import { syncOfficialMvps } from "@/lib/live/sync-official-mvp";
import type { AdminClient } from "@/lib/scripts/supabase-admin";

export type SyncScoresRecalcResult = {
  scannedPending: number;
  claimedForScoring: number;
  scoresRecalculated: number;
  poolsRebuilt: number;
  mvpsPersisted: number; // passed through from syncOfficialMvps
  errors: string[];
};

export async function syncScoresRecalc(
  admin: AdminClient,
  nowMs: number = Date.now()
): Promise<SyncScoresRecalcResult> {
  const result: SyncScoresRecalcResult = {
    scannedPending: 0,
    claimedForScoring: 0,
    scoresRecalculated: 0,
    poolsRebuilt: 0,
    mvpsPersisted: 0,
    errors: [],
  };

  const poolsToRebuild = new Set<string>();

  try {
    // 1. Sync MVPs first. This might internally call recalculate_match_scores 
    // for matches that just got their MVP, and will add to poolsToRebuild.
    // We pass a dummy result object that matches SyncLiveMatchesResult shape 
    // to avoid modifying the syncOfficialMvps signature excessively right now.
    const mvpResult = {
      scanned: 0, updated: 0, markedLive: 0, markedFinished: 0,
      resultsPersisted: 0, scoresRecalculated: 0, mvpsPersisted: 0,
      headlinesPersisted: 0, poolsRebuilt: 0, errors: []
    };
    await syncOfficialMvps(admin, mvpResult as any, poolsToRebuild, nowMs);
    result.mvpsPersisted += mvpResult.mvpsPersisted;
    result.scoresRecalculated += mvpResult.scoresRecalculated;
    result.errors.push(...mvpResult.errors);
  } catch (error) {
    result.errors.push(`mvp sync: ${error instanceof Error ? error.message : String(error)}`);
  }

  // 2. Find pending matches to score (initial calculation when match finishes)
  // Also include stale 'processing' matches (crashed mid-calculation, older than 15 mins)
  const staleThreshold = new Date(nowMs - 15 * 60 * 1000).toISOString();
  
  const { data: pendingMatches, error: pendingError } = await admin
    .from("matches")
    .select("id")
    .eq("status", "finished")
    .or(`scoring_status.eq.pending,and(scoring_status.eq.processing,scoring_started_at.lt.${staleThreshold})`);

  if (pendingError) {
    result.errors.push(`fetch pending: ${pendingError.message}`);
    return result;
  }

  result.scannedPending = pendingMatches?.length ?? 0;

  if (result.scannedPending > 0) {
    const pendingIds = pendingMatches!.map((m) => m.id as string);

    // 3. Claim the matches (Optimistic Locking)
    const { data: claimed, error: claimError } = await admin
      .from("matches")
      .update({
        scoring_status: "processing",
        scoring_started_at: new Date(nowMs).toISOString(),
      })
      .in("id", pendingIds)
      // Only claim if it's still pending or stale
      .or(`scoring_status.eq.pending,and(scoring_status.eq.processing,scoring_started_at.lt.${staleThreshold})`)
      .select("id");

    if (claimError) {
      result.errors.push(`claim matches: ${claimError.message}`);
    } else if (claimed && claimed.length > 0) {
      const claimedIds = claimed.map(c => c.id as string);
      result.claimedForScoring = claimedIds.length;

      // 4. Recalculate scores for claimed matches
      for (const matchId of claimedIds) {
        const { error: recalcError } = await admin.rpc("recalculate_match_scores", {
          p_match_id: matchId,
        });

        if (recalcError) {
          result.errors.push(`${matchId}/recalc: ${recalcError.message}`);
          // Mark as error
          await admin.from("matches").update({ scoring_status: "error" }).eq("id", matchId);
          continue;
        }

        result.scoresRecalculated += 1;

        // Find pool to rebuild
        const poolId = await loadPoolIdForMatch(admin, matchId);
        if (poolId) poolsToRebuild.add(poolId);

        // Mark completed
        await admin.from("matches").update({
          scoring_status: "completed",
          scoring_completed_at: new Date().toISOString(),
        }).eq("id", matchId);
      }
    }
  }

  // 5. Rebuild pools accumulated from MVPs and newly scored matches
  for (const poolId of poolsToRebuild) {
    const { error: rebuildError } = await admin.rpc("rebuild_pool_member_scores", {
      p_pool_id: poolId,
    });
    if (rebuildError) {
      result.errors.push(`${poolId}/rebuild: ${rebuildError.message}`);
      continue;
    }
    result.poolsRebuilt += 1;
  }

  return result;
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
