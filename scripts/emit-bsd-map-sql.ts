/**
 * Genera SQL upsert para external_id_map (BSD) sin credenciales Supabase.
 * Lee partidos desde stdin (JSON array).
 */
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
  const metadata = {
    external_match_id: row.match.external_match_id,
    bsd_home: row.fixture.homeName,
    bsd_away: row.fixture.awayName,
    bsd_kickoff: row.fixture.kickoffIso,
    internal_kickoff: row.match.kickoff_at,
    kickoff_delta_minutes: row.kickoffDeltaMinutes,
  };

  return `(
    '${BSD_SOURCE_CODE}',
    '${row.fixture.fixtureId}',
    'match',
    'matches',
    '${row.match.id}'::uuid,
    '${sqlEscape(JSON.stringify(metadata))}'::jsonb,
    'mapped'
  )`;
}

async function main() {
  if (!process.env.BSD_API_KEY?.trim()) {
    throw new Error("Falta BSD_API_KEY.");
  }

  const fileArg = process.argv.find((arg) => arg.startsWith("--matches-file="));
  const raw = fileArg
    ? await readFile(fileArg.slice("--matches-file=".length))
    : await readStdin();
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

  console.error(
    `[emit-bsd-map-sql] mapped=${mapped.length} unmapped=${unmapped.length} bsd=${fixtures.length}`
  );

  if (mapped.length === 0) {
    return;
  }

  const values = mapped.map(rowToSql).join(",\n");
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

  console.log(sql);
}

async function readFile(path: string): Promise<string> {
  const fs = await import("node:fs/promises");
  return fs.readFile(path, "utf8");
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
