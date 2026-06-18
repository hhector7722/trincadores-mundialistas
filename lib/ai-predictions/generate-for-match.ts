import { createAdminClient } from "@/lib/supabase/admin";
import type { PredictionInsightSource } from "@/lib/ai-predictions/source-config";
import {
  HYBRID_INSIGHT_CACHE_MS,
  resolvePredictionInsightSource,
} from "@/lib/ai-predictions/source-config";
import { getPredictionInsightForMatch } from "@/lib/ai-predictions/queries";
import {
  generateAndPersistHybridInsight,
  generateAndPersistBsdInsight,
  resolveBsdEventIdForMatch,
  type MatchInsightContext,
} from "@/lib/ai-predictions/persist-insight";
import type { PredictionInsight } from "@/lib/ai-predictions/types";

async function loadMatchContext(matchId: string): Promise<MatchInsightContext | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, matchdays(name)")
    .eq("id", matchId)
    .maybeSingle();

  if (error || !data) return null;

  const bsdEventId = await resolveBsdEventIdForMatch(admin, matchId);
  if (bsdEventId == null) return null;

  return {
    id: data.id as string,
    home_team: data.home_team as string,
    away_team: data.away_team as string,
    kickoff_at: data.kickoff_at as string,
    matchday_name: (data.matchdays as { name?: string } | null)?.name ?? null,
    bsd_event_id: bsdEventId,
  };
}

function isCacheFresh(insight: PredictionInsight, source: PredictionInsightSource): boolean {
  if (source !== "hybrid") return true;
  const updatedMs = new Date(insight.updatedAt).getTime();
  if (Number.isNaN(updatedMs)) return false;
  return Date.now() - updatedMs < HYBRID_INSIGHT_CACHE_MS;
}

export async function resolvePredictionInsightForMatch(
  matchId: string,
  options?: { source?: PredictionInsightSource; force?: boolean },
): Promise<PredictionInsight | null> {
  const source = options?.source ?? resolvePredictionInsightSource();

  if (!options?.force) {
    const cached = await getPredictionInsightForMatch(matchId);
    if (cached && cached.sourceCode === source && isCacheFresh(cached, source)) {
      return cached;
    }
  }

  const match = await loadMatchContext(matchId);
  if (!match) return null;

  const admin = createAdminClient();

  if (source === "hybrid") {
    return generateAndPersistHybridInsight(admin, match);
  }

  return generateAndPersistBsdInsight(admin, match);
}
