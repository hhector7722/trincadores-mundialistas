import type { InternalMatchRef } from "@/lib/lineup/sources/api-football-match-mapper";
import { FOTMOB_SOURCE_CODE } from "@/lib/lineup/sources/fotmob-client";
import {
  fotMobListItemToFixture,
  mapFotmobFixturesToInternalMatches,
  type FotMobFixtureRef,
} from "@/lib/lineup/sources/fotmob-match-mapper";
import { loadFotmobMatchesForDate } from "@/lib/live/sources/fotmob-official-mvp";
import type { AdminClient } from "@/lib/scripts/supabase-admin";
import { upsertChunks } from "@/lib/scripts/supabase-admin";
import type { ExternalIdMapRow } from "@/lib/worldcup-data/types";

export type SyncFotmobFixturesResult = {
  internalTotal: number;
  alreadyMapped: number;
  candidates: number;
  fotmobFixturesLoaded: number;
  datesFetched: number;
  newlyMapped: number;
  stillUnmapped: number;
  persisted: number;
  skipped: boolean;
  errors: string[];
};

function kickoffDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

async function loadInternalMatches(admin: AdminClient): Promise<InternalMatchRef[]> {
  const { data, error } = await admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, external_match_id")
    .order("kickoff_at", { ascending: true });

  if (error) throw new Error(`matches: ${error.message}`);
  return (data ?? []) as InternalMatchRef[];
}

async function loadMappedMatchIds(admin: AdminClient): Promise<Set<string>> {
  const { data, error } = await admin
    .from("external_id_map")
    .select("internal_id")
    .eq("source_code", FOTMOB_SOURCE_CODE)
    .eq("entity_type", "match")
    .eq("match_status", "mapped")
    .not("internal_id", "is", null);

  if (error) throw new Error(`external_id_map: ${error.message}`);

  return new Set(
    (data ?? [])
      .map((row) => row.internal_id as string | null)
      .filter((id): id is string => Boolean(id)),
  );
}

async function loadFotmobFixturesForDates(dateKeys: string[]): Promise<{
  fixtures: FotMobFixtureRef[];
  errors: string[];
}> {
  const fixtures: FotMobFixtureRef[] = [];
  const errors: string[] = [];

  for (const dateKey of dateKeys) {
    try {
      const rows = await loadFotmobMatchesForDate(dateKey);
      for (const row of rows) {
        const fixture = fotMobListItemToFixture(row);
        if (fixture) fixtures.push(fixture);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "FotMob fetch failed";
      errors.push(`${dateKey}: ${message}`);
    }
  }

  return { fixtures, errors };
}

export async function syncFotmobFixtures(
  admin: AdminClient,
  options?: { persist?: boolean },
): Promise<SyncFotmobFixturesResult> {
  const persist = options?.persist ?? true;
  const result: SyncFotmobFixturesResult = {
    internalTotal: 0,
    alreadyMapped: 0,
    candidates: 0,
    fotmobFixturesLoaded: 0,
    datesFetched: 0,
    newlyMapped: 0,
    stillUnmapped: 0,
    persisted: 0,
    skipped: false,
    errors: [],
  };

  const [matches, mappedIds] = await Promise.all([
    loadInternalMatches(admin),
    loadMappedMatchIds(admin),
  ]);

  result.internalTotal = matches.length;
  result.alreadyMapped = mappedIds.size;

  const candidates = matches.filter((match) => !mappedIds.has(match.id));
  result.candidates = candidates.length;

  if (!candidates.length) {
    result.skipped = true;
    return result;
  }

  const dateKeys = [
    ...new Set(candidates.map((match) => kickoffDateKey(match.kickoff_at)).filter(Boolean)),
  ].sort();
  result.datesFetched = dateKeys.length;

  const { fixtures, errors: fetchErrors } = await loadFotmobFixturesForDates(dateKeys);
  result.errors.push(...fetchErrors);
  result.fotmobFixturesLoaded = fixtures.length;

  const { mapped, unmapped } = mapFotmobFixturesToInternalMatches(candidates, fixtures);
  result.newlyMapped = mapped.length;
  result.stillUnmapped = unmapped.length;

  if (!persist || !mapped.length) return result;

  const rows: ExternalIdMapRow[] = mapped.map(({ match, fixture, kickoffDeltaMinutes }) => ({
    source_code: FOTMOB_SOURCE_CODE,
    external_key: String(fixture.fixtureId),
    entity_type: "match",
    internal_table: "matches",
    internal_id: match.id,
    metadata: {
      external_match_id: match.external_match_id,
      fotmob_home: fixture.homeName,
      fotmob_away: fixture.awayName,
      fotmob_kickoff: fixture.kickoffIso,
      internal_kickoff: match.kickoff_at,
      kickoff_delta_minutes: kickoffDeltaMinutes,
    },
    match_status: "mapped",
  }));

  result.persisted = await upsertChunks(admin, "external_id_map", rows, "source_code,external_key");
  return result;
}
