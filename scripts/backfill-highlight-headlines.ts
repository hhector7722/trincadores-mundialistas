/**
 * Regenera titulares de highlights en partidos finalizados.
 * Por defecto solo reemplaza titulares generados por incidentes BSD.
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/backfill-highlight-headlines.ts
 *   npx tsx --env-file=.env.local scripts/backfill-highlight-headlines.ts --all
 *   npx tsx --env-file=.env.local scripts/backfill-highlight-headlines.ts --dry-run --limit=5
 */
import { syncBsdHeadlineForMatch } from "@/lib/highlights/sync-bsd-headline";
import { createAdminClient } from "@/lib/scripts/supabase-admin";

type MatchRow = {
  id: string;
  home_team: string;
  away_team: string;
  highlight_headline: string | null;
  highlight_headline_source: string | null;
};

function parseArgs(argv: string[]) {
  const limitArg = argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : null;

  return {
    dryRun: argv.includes("--dry-run"),
    all: argv.includes("--all"),
    limit: Number.isFinite(limit) && (limit ?? 0) > 0 ? Math.floor(limit!) : null,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const admin = createAdminClient();

  let query = admin
    .from("matches")
    .select("id, home_team, away_team, highlight_headline, highlight_headline_source")
    .eq("status", "finished")
    .order("kickoff_at", { ascending: false });

  if (!args.all) {
    query = query.eq("highlight_headline_source", "bsd_incidents");
  }

  if (args.limit) {
    query = query.limit(args.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const matches = (data ?? []) as MatchRow[];
  const result = {
    scanned: matches.length,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
    dryRun: args.dryRun,
    all: args.all,
  };

  for (const match of matches) {
    const label = `${match.home_team} vs ${match.away_team}`;
    if (args.dryRun) {
      console.log(`[dry-run] ${label} — ${match.highlight_headline ?? "(sin titular)"}`);
      result.skipped += 1;
      continue;
    }

    try {
      const written = await syncBsdHeadlineForMatch(admin, match.id, { force: true });
      if (written) {
        result.updated += 1;
        console.log(`OK ${label}`);
      } else {
        result.skipped += 1;
        console.log(`SKIP ${label}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push(`${match.id}: ${message}`);
      console.error(`ERR ${label}: ${message}`);
    }
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
