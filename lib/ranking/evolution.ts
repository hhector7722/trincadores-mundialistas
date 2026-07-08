import {
  buildPositionsFromSnapshots,
  loadPoolRankingMembers,
  loadRankingSnapshotThroughKickoff,
  type PoolRankingMember,
  type RankingEvolutionStanding,
} from "@/lib/ranking/queries";
import { createClient } from "@/lib/supabase/server";

export type RankingEvolutionMatchday = {
  id: string;
  name: string;
  sequence: number;
  shortLabel: string;
};

export type RankingEvolutionData = {
  members: PoolRankingMember[];
  /** Posiciones tras la primera jornada (ancla de avatares a la izquierda). */
  initialStandings: RankingEvolutionStanding[];
  matchdays: RankingEvolutionMatchday[];
  points: Array<{
    matchdayId: string;
    standings: RankingEvolutionStanding[];
  }>;
};

function matchdayShortLabel(sequence: number, name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= 6) return trimmed;
  return `J${sequence}`;
}

type MatchdayCutoff = {
  id: string;
  name: string;
  sequence: number;
  throughKickoffAt: string;
};

async function loadMatchdayCutoffs(poolId: string): Promise<MatchdayCutoff[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select("kickoff_at, matchday_id, matchdays!inner(id, name, sequence, pool_id)")
    .eq("scoring_status", "completed")
    .eq("matchdays.pool_id", poolId)
    .order("kickoff_at", { ascending: true });

  if (error) throw new Error(error.message);

  const byMatchday = new Map<string, MatchdayCutoff>();
  for (const row of data ?? []) {
    const raw = row.matchdays;
    const matchday = (Array.isArray(raw) ? raw[0] : raw) as {
      id: string;
      name: string;
      sequence: number;
    } | null;
    if (!matchday?.id) continue;
    const kickoffAt = row.kickoff_at as string;
    const existing = byMatchday.get(matchday.id);
    if (!existing || kickoffAt > existing.throughKickoffAt) {
      byMatchday.set(matchday.id, {
        id: matchday.id,
        name: matchday.name,
        sequence: matchday.sequence,
        throughKickoffAt: kickoffAt,
      });
    }
  }

  return [...byMatchday.values()].sort((a, b) => a.sequence - b.sequence);
}

export async function getPoolRankingEvolution(poolId: string): Promise<RankingEvolutionData> {
  const [members, cutoffs] = await Promise.all([
    loadPoolRankingMembers(poolId),
    loadMatchdayCutoffs(poolId),
  ]);

  if (!members.length || !cutoffs.length) {
    return { members, initialStandings: [], matchdays: [], points: [] };
  }

  const snapshots = await Promise.all(
    cutoffs.map((cutoff) =>
      loadRankingSnapshotThroughKickoff(poolId, cutoff.throughKickoffAt)
    )
  );

  const allMatchdays: RankingEvolutionMatchday[] = cutoffs.map((cutoff) => ({
    id: cutoff.id,
    name: cutoff.name,
    sequence: cutoff.sequence,
    shortLabel: matchdayShortLabel(cutoff.sequence, cutoff.name),
  }));

  const allPoints = cutoffs.map((cutoff, index) => ({
    matchdayId: cutoff.id,
    standings: buildPositionsFromSnapshots(members, snapshots[index]!),
  }));

  const initialStandings = allPoints[0]?.standings ?? [];

  return {
    members,
    initialStandings,
    matchdays: allMatchdays,
    points: allPoints,
  };
}
