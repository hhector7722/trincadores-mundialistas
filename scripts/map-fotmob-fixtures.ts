/**
 * Mapea partidos OpenFootball → match IDs de FotMob en external_id_map.
 */
import { parseScriptCli, logCliOptions } from "@/lib/scripts/cli";
import { assertImportAllowed } from "@/lib/scripts/env-guard";
import { createAdminClient, upsertChunks } from "@/lib/scripts/supabase-admin";
import type { InternalMatchRef } from "@/lib/lineup/sources/api-football-match-mapper";
import { FOTMOB_SOURCE_CODE } from "@/lib/lineup/sources/fotmob-client";
import {
  fotMobListItemToFixture,
  mapFotmobFixturesToInternalMatches,
} from "@/lib/lineup/sources/fotmob-match-mapper";
import { loadFotmobMatchesForDate } from "@/lib/live/sources/fotmob-official-mvp";
import type { ExternalIdMapRow } from "@/lib/worldcup-data/types";

async function loadInternalMatches(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, external_match_id")
    .order("kickoff_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as InternalMatchRef[];
}

function kickoffDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

async function main() {
  assertImportAllowed();
  const opts = parseScriptCli(process.argv.slice(2));
  logCliOptions("map-fotmob-fixtures", opts);

  const admin = createAdminClient();
  const matches = await loadInternalMatches(admin);

  const uniqueDates = [...new Set(matches.map((match) => kickoffDateKey(match.kickoff_at)).filter(Boolean))];
  const fixtures = [];

  for (const dateKey of uniqueDates) {
    const rows = await loadFotmobMatchesForDate(dateKey);
    for (const row of rows) {
      const fixture = fotMobListItemToFixture(row);
      if (fixture) fixtures.push(fixture);
    }
  }

  const { mapped, unmapped } = mapFotmobFixturesToInternalMatches(matches, fixtures);

  console.log(
    `[map-fotmob-fixtures] internos=${matches.length} fotmob=${fixtures.length} fechas=${uniqueDates.length}`
  );
  console.log(`[map-fotmob-fixtures] mapeados=${mapped.length} sin mapear=${unmapped.length}`);

  for (const row of mapped.slice(0, 10)) {
    console.log(
      `  ✓ ${row.match.external_match_id ?? row.match.id}: ${row.match.home_team} vs ${row.match.away_team} → fotmob ${row.fixture.fixtureId} (Δ${row.kickoffDeltaMinutes}m)`
    );
  }

  if (opts.dryRun || !opts.insert) {
    console.log("[map-fotmob-fixtures] dry-run: no se escribió en BD. Usa --insert para persistir.");
    return;
  }

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

  const written = await upsertChunks(admin, "external_id_map", rows, "source_code,external_key");
  console.log(`[map-fotmob-fixtures] external_id_map upsert: ${written} filas`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
