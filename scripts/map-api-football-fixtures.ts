/**
 * Mapea partidos OpenFootball (matches) → fixture IDs de API-Football en external_id_map.
 * Requiere API_FOOTBALL_KEY y ALLOW_IMPORT=1.
 *
 * Uso:
 *   npm run db:map-api-football-fixtures -- --dry-run
 *   npm run db:map-api-football-fixtures -- --insert
 */
import { parseScriptCli, logCliOptions } from "@/lib/scripts/cli";
import { assertImportAllowed } from "@/lib/scripts/env-guard";
import { createAdminClient, upsertChunks } from "@/lib/scripts/supabase-admin";
import { API_FOOTBALL_SOURCE_CODE } from "@/lib/lineup/sources/api-football-constants";
import { fetchWorldCupFixturesFromApiFootball } from "@/lib/lineup/sources/api-football-client";
import {
  mapFixturesToInternalMatches,
  type InternalMatchRef,
} from "@/lib/lineup/sources/api-football-match-mapper";
import type { ExternalIdMapRow } from "@/lib/worldcup-data/types";

async function loadInternalMatches(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, external_match_id, status")
    .order("kickoff_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as InternalMatchRef[];
}

function toExternalIdRows(mapped: ReturnType<typeof mapFixturesToInternalMatches>["mapped"]): ExternalIdMapRow[] {
  return mapped.map(({ match, fixture, kickoffDeltaMinutes }) => ({
    source_code: API_FOOTBALL_SOURCE_CODE,
    external_key: String(fixture.fixtureId),
    entity_type: "match",
    internal_table: "matches",
    internal_id: match.id,
    metadata: {
      external_match_id: match.external_match_id,
      api_home: fixture.homeName,
      api_away: fixture.awayName,
      api_kickoff: fixture.kickoffIso,
      internal_kickoff: match.kickoff_at,
      kickoff_delta_minutes: kickoffDeltaMinutes,
      api_home_team_id: fixture.homeTeamId,
      api_away_team_id: fixture.awayTeamId,
    },
    match_status: "mapped",
  }));
}

async function main() {
  assertImportAllowed();
  const opts = parseScriptCli(process.argv.slice(2));
  logCliOptions("map-api-football-fixtures", opts);

  const admin = createAdminClient();
  const [matches, apiResult] = await Promise.all([
    loadInternalMatches(admin),
    fetchWorldCupFixturesFromApiFootball(),
  ]);

  const { mapped, unmapped } = mapFixturesToInternalMatches(matches, apiResult.fixtures);

  console.log(
    `[map-api-football-fixtures] partidos internos=${matches.length} fixtures API=${apiResult.fixtures.length} requests=${apiResult.requests}`
  );
  console.log(`[map-api-football-fixtures] mapeados=${mapped.length} sin mapear=${unmapped.length}`);

  for (const row of mapped.slice(0, 10)) {
    console.log(
      `  ✓ ${row.match.external_match_id ?? row.match.id}: ${row.match.home_team} vs ${row.match.away_team} → fixture ${row.fixture.fixtureId} (Δ${row.kickoffDeltaMinutes}m)`
    );
  }
  if (mapped.length > 10) {
    console.log(`  … y ${mapped.length - 10} más`);
  }

  for (const row of unmapped.slice(0, 10)) {
    console.log(
      `  ✗ ${row.external_match_id ?? row.id}: ${row.home_team} vs ${row.away_team} @ ${row.kickoff_at}`
    );
  }
  if (unmapped.length > 10) {
    console.log(`  … y ${unmapped.length - 10} sin mapear`);
  }

  if (opts.dryRun || !opts.insert) {
    console.log("[map-api-football-fixtures] dry-run: no se escribió en BD. Usa --insert para persistir.");
    return;
  }

  const rows = toExternalIdRows(mapped);
  const written = await upsertChunks(admin, "external_id_map", rows, "source_code,external_key");
  console.log(`[map-api-football-fixtures] external_id_map upsert: ${written} filas`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
