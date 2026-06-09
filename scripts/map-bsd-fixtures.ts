/**
 * Mapea partidos OpenFootball → event IDs de BSD (Bzzoiro) en external_id_map.
 * Requiere BSD_API_KEY y ALLOW_IMPORT=1.
 */
import { parseScriptCli, logCliOptions } from "@/lib/scripts/cli";
import { assertImportAllowed } from "@/lib/scripts/env-guard";
import { createAdminClient, upsertChunks } from "@/lib/scripts/supabase-admin";
import { mapFixturesToInternalMatches } from "@/lib/lineup/sources/api-football-match-mapper";
import { BSD_SOURCE_CODE } from "@/lib/lineup/sources/bsd-constants";
import { fetchWorldCupEventsFromBsd } from "@/lib/lineup/sources/bsd-client";
import type { ExternalIdMapRow } from "@/lib/worldcup-data/types";

async function loadInternalMatches(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, external_match_id")
    .order("kickoff_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function main() {
  assertImportAllowed();
  const opts = parseScriptCli(process.argv.slice(2));
  logCliOptions("map-bsd-fixtures", opts);

  const admin = createAdminClient();
  const [matches, bsdResult] = await Promise.all([
    loadInternalMatches(admin),
    fetchWorldCupEventsFromBsd(),
  ]);

  const fixtures = bsdResult.events.map((event) => ({
    fixtureId: event.fixtureId,
    kickoffIso: event.kickoffIso,
    homeName: event.homeName,
    awayName: event.awayName,
    homeTeamId: event.homeTeamId,
    awayTeamId: event.awayTeamId,
  }));

  const { mapped, unmapped } = mapFixturesToInternalMatches(matches, fixtures);

  console.log(
    `[map-bsd-fixtures] internos=${matches.length} bsd=${fixtures.length} requests=${bsdResult.requests}`
  );
  console.log(`[map-bsd-fixtures] mapeados=${mapped.length} sin mapear=${unmapped.length}`);

  for (const row of mapped.slice(0, 10)) {
    console.log(
      `  ✓ ${row.match.external_match_id ?? row.match.id}: ${row.match.home_team} vs ${row.match.away_team} → event ${row.fixture.fixtureId} (Δ${row.kickoffDeltaMinutes}m)`
    );
  }

  if (opts.dryRun || !opts.insert) {
    console.log("[map-bsd-fixtures] dry-run: no se escribió en BD. Usa --insert para persistir.");
    return;
  }

  const rows: ExternalIdMapRow[] = mapped.map(({ match, fixture, kickoffDeltaMinutes }) => ({
    source_code: BSD_SOURCE_CODE,
    external_key: String(fixture.fixtureId),
    entity_type: "match",
    internal_table: "matches",
    internal_id: match.id,
    metadata: {
      external_match_id: match.external_match_id,
      bsd_home: fixture.homeName,
      bsd_away: fixture.awayName,
      bsd_kickoff: fixture.kickoffIso,
      internal_kickoff: match.kickoff_at,
      kickoff_delta_minutes: kickoffDeltaMinutes,
    },
    match_status: "mapped",
  }));

  const written = await upsertChunks(admin, "external_id_map", rows, "source_code,external_key");
  console.log(`[map-bsd-fixtures] external_id_map upsert: ${written} filas`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
