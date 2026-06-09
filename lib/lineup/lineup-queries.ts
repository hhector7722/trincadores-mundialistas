import type {
  LineupBenchPlayer,
  LineupSourceKind,
  LineupSlot,
  ResolvedLineup,
  StoredLineupRow,
} from "@/lib/lineup/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const SOURCE_PRIORITY: Record<LineupSourceKind, number> = {
  confirmed: 3,
  predicted: 2,
  fallback: 1,
};

function rowToResolved(row: StoredLineupRow): ResolvedLineup {
  const formation = row.formation === "4-4-2" ? "4-4-2" : "4-3-3";
  const bench = row.bench as LineupBenchPlayer[];
  return {
    formation,
    formationLabel: row.formation,
    slots: row.slots as LineupSlot[],
    bench,
    benchCount: bench.length,
    isProbable: row.source_kind !== "confirmed",
    sourceKind: row.source_kind,
    dataSourceCode: row.data_source_code,
    fetchedAt: row.fetched_at,
  };
}

export async function loadCachedTeamLineup(
  supabase: SupabaseClient,
  matchId: string,
  teamName: string
): Promise<ResolvedLineup | null> {
  const { data, error } = await supabase
    .from("match_team_lineups")
    .select(
      "match_id, team_name, source_kind, data_source_code, formation, slots, bench, fetched_at, updated_at"
    )
    .eq("match_id", matchId)
    .eq("team_name", teamName)
    .maybeSingle();

  if (error || !data) return null;
  return rowToResolved(data as StoredLineupRow);
}

export function isBetterLineupSource(
  candidate: LineupSourceKind,
  current: LineupSourceKind | null
): boolean {
  if (!current) return true;
  return SOURCE_PRIORITY[candidate] > SOURCE_PRIORITY[current];
}

export async function upsertTeamLineup(
  supabase: SupabaseClient,
  matchId: string,
  teamName: string,
  lineup: ResolvedLineup,
  bench: LineupBenchPlayer[] = []
): Promise<void> {
  const existing = await loadCachedTeamLineup(supabase, matchId, teamName);
  if (existing && !isBetterLineupSource(lineup.sourceKind, existing.sourceKind)) {
    return;
  }

  const payload = {
    match_id: matchId,
    team_name: teamName,
    source_kind: lineup.sourceKind,
    data_source_code: lineup.dataSourceCode,
    formation: lineup.formationLabel,
    slots: lineup.slots,
    bench,
    fetched_at: lineup.fetchedAt,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("match_team_lineups").upsert(payload, {
    onConflict: "match_id,team_name",
  });

  if (error) {
    console.error("[lineup] upsertTeamLineup failed", error.message);
  }
}
