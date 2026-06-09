/**
 * Calcula mapeo BSD y escribe lotes SQL en scripts/.cache/bsd-map-batch-*.sql
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { mapFixturesToInternalMatches } from "@/lib/lineup/sources/api-football-match-mapper";
import { fetchWorldCupEventsFromBsd } from "@/lib/lineup/sources/bsd-client";
import { BSD_SOURCE_CODE } from "@/lib/lineup/sources/bsd-constants";

type MatchRow = {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  external_match_id: string | null;
};

function sqlEscape(value: string): string {
  return value.replace(/'/g, "''");
}

function rowToSql(row: ReturnType<typeof mapFixturesToInternalMatches>["mapped"][number]): string {
  const metadata = JSON.stringify({
    external_match_id: row.match.external_match_id,
    bsd_home: row.fixture.homeName,
    bsd_away: row.fixture.awayName,
    bsd_kickoff: row.fixture.kickoffIso,
    internal_kickoff: row.match.kickoff_at,
    kickoff_delta_minutes: row.kickoffDeltaMinutes,
  });

  return `(
    '${BSD_SOURCE_CODE}',
    '${row.fixture.fixtureId}',
    'match',
    'matches',
    '${row.match.id}'::uuid,
    '${sqlEscape(metadata)}'::jsonb,
    'mapped'
  )`;
}

async function main() {
  const matchesFile = process.argv[2];
  if (!matchesFile) throw new Error("Uso: tsx scripts/run-bsd-map-via-mcp.ts <matches.json>");

  const raw = await readFile(matchesFile);
  const matches = JSON.parse(raw) as MatchRow[];
  const { events } = await fetchWorldCupEventsFromBsd();

  const fixtures = events.map((event) => ({
    fixtureId: event.fixtureId,
    kickoffIso: event.kickoffIso,
    homeName: event.homeName,
    awayName: event.awayName,
    homeTeamId: event.homeTeamId,
    awayTeamId: event.awayTeamId,
  }));

  const { mapped, unmapped } = mapFixturesToInternalMatches(matches, fixtures);
  const batchSize = 25;
  const outDir = resolve(process.cwd(), "scripts/.cache");

  console.log(
    JSON.stringify({
      mapped: mapped.length,
      unmapped: unmapped.length,
      bsdEvents: fixtures.length,
      batches: Math.ceil(mapped.length / batchSize),
      unmappedSample: unmapped.slice(0, 15).map((m) => m.external_match_id),
    })
  );

  for (let i = 0; i < mapped.length; i += batchSize) {
    const chunk = mapped.slice(i, i + batchSize);
    const values = chunk.map(rowToSql).join(",\n");
    const sql = `insert into public.external_id_map (
  source_code, external_key, entity_type, internal_table, internal_id, metadata, match_status
)
values
${values}
on conflict (source_code, external_key) do update set
  internal_id = excluded.internal_id,
  metadata = excluded.metadata,
  match_status = excluded.match_status,
  updated_at = now();`;

    const batchIndex = Math.floor(i / batchSize);
    await writeFile(resolve(outDir, `bsd-map-batch-${batchIndex}.sql`), sql, "utf8");
  }
}

async function readFile(path: string): Promise<string> {
  const fs = await import("node:fs/promises");
  return fs.readFile(path, "utf8");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
