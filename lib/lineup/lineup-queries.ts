import { isFormationId } from "@/lib/lineup/formation-coordinates";
import { normalizeFormationId, normalizeFormationTemplate } from "@/lib/lineup/formation-templates";
import { relayoutLineupSlots } from "@/lib/lineup/relayout-lineup";
import type {
  FormationId,
  LineupBenchPlayer,
  LineupSourceKind,
  LineupSlot,
  ResolvedLineup,
  StoredLineupRow,
} from "@/lib/lineup/types";
import { createAdminClient } from "@/lib/scripts/supabase-admin";
import type { SupabaseClient } from "@supabase/supabase-js";

const SOURCE_PRIORITY: Record<LineupSourceKind, number> = {
  confirmed: 3,
  predicted: 2,
  fallback: 1,
};

function rowToResolved(row: StoredLineupRow): ResolvedLineup {
  const formation = normalizeFormationTemplate(row.formation);
  const bench = row.bench as LineupBenchPlayer[];
  return relayoutLineupSlots({
    formation,
    formationLabel: row.formation,
    slots: row.slots as LineupSlot[],
    bench,
    benchCount: bench.length,
    isProbable: row.source_kind !== "confirmed",
    sourceKind: row.source_kind,
    dataSourceCode: row.data_source_code,
    fetchedAt: row.fetched_at,
  });
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

/** Última formación externa conocida del equipo (predicted o confirmed). */
export async function loadLastKnownFormation(
  supabase: SupabaseClient,
  teamName: string
): Promise<FormationId | null> {
  try {
    const { data, error } = await supabase
      .from("match_team_lineups")
      .select("formation")
      .eq("team_name", teamName)
      .in("source_kind", ["predicted", "confirmed"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data?.formation) return null;

    const formation = (data.formation as string).trim();
    if (!formation || !isFormationId(formation)) return null;

    return normalizeFormationId(formation);
  } catch {
    return null;
  }
}

export function isBetterLineupSource(
  candidate: LineupSourceKind,
  current: LineupSourceKind | null
): boolean {
  if (!current) return true;
  return SOURCE_PRIORITY[candidate] > SOURCE_PRIORITY[current];
}

type TeamMatchRef = {
  id: string;
  kickoff_at: string;
  status: string | null;
};

function mergeTeamMatches(rows: TeamMatchRef[]): TeamMatchRef[] {
  const byId = new Map<string, TeamMatchRef>();
  for (const row of rows) {
    byId.set(row.id, row);
  }
  return [...byId.values()].sort((a, b) => a.kickoff_at.localeCompare(b.kickoff_at));
}

/** Próximo partido programado de la selección; si no hay, el primero del calendario. */
export async function findPrimaryMatchIdForTeam(
  supabase: SupabaseClient,
  teamName: string
): Promise<string | null> {
  const [homeRes, awayRes] = await Promise.all([
    supabase.from("matches").select("id, kickoff_at, status").eq("home_team", teamName),
    supabase.from("matches").select("id, kickoff_at, status").eq("away_team", teamName),
  ]);

  const matches = mergeTeamMatches([...(homeRes.data ?? []), ...(awayRes.data ?? [])]);
  if (!matches.length) return null;

  const now = new Date().toISOString();
  const upcoming = matches.find(
    (match) => match.status === "scheduled" && match.kickoff_at >= now
  );
  return upcoming?.id ?? matches[0].id;
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

  const normalized = relayoutLineupSlots({ ...lineup, bench, benchCount: bench.length });

  const payload = {
    match_id: matchId,
    team_name: teamName,
    source_kind: normalized.sourceKind,
    data_source_code: normalized.dataSourceCode,
    formation: normalized.formationLabel,
    slots: normalized.slots,
    bench,
    fetched_at: normalized.fetchedAt,
    updated_at: new Date().toISOString(),
  };

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("match_team_lineups").upsert(payload, {
      onConflict: "match_id,team_name",
    });

    if (error) {
      console.error("[lineup] upsertTeamLineup failed", error.message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "admin client unavailable";
    console.error("[lineup] upsertTeamLineup failed", message);
  }
}
