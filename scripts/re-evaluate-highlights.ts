/**
 * Re-evalúa todos los resúmenes con la nueva prioridad: FIFA > Replay > Teledeporte > DAZN ES
 * DAZN ES deshabilita la reproducción embebida en otros sitios web.
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/re-evaluate-highlights.ts
 *   npx tsx --env-file=.env.local scripts/re-evaluate-highlights.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/re-evaluate-highlights.ts --dry-run --limit=5
 */
import { createAdminClient } from "@/lib/scripts/supabase-admin";
import {
  SOURCE_PRIORITY,
  type HighlightSourceCode,
} from "@/lib/youtube/highlight-priority";

type MatchRow = {
  id: string;
  home_team: string;
  away_team: string;
  highlight_youtube_id: string | null;
  highlight_published_at: string | null;
  highlight_source: HighlightSourceCode | null;
};

type ExternalRefRow = {
  external_key: string;
  source_code: HighlightSourceCode;
  metadata: { published_at?: string } | null;
  internal_id: string;
};

function parseArgs(argv: string[]) {
  const limitArg = argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : null;

  return {
    dryRun: argv.includes("--dry-run"),
    limit: Number.isFinite(limit) && (limit ?? 0) > 0 ? Math.floor(limit!) : null,
  };
}

function bestSource(
  sources: { sourceCode: HighlightSourceCode; videoId: string; publishedAt: string }[],
): { sourceCode: HighlightSourceCode; videoId: string; publishedAt: string } | null {
  if (!sources.length) return null;
  return sources.reduce((best, current) => {
    const bestPriority = SOURCE_PRIORITY[best.sourceCode] ?? 0;
    const currentPriority = SOURCE_PRIORITY[current.sourceCode] ?? 0;
    if (currentPriority > bestPriority) return current;
    if (currentPriority < bestPriority) return best;
    return new Date(current.publishedAt).getTime() >= new Date(best.publishedAt).getTime()
      ? current
      : best;
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const admin = createAdminClient();

  const { data: matches, error } = await admin
    .from("matches")
    .select("id, home_team, away_team, highlight_youtube_id, highlight_published_at, highlight_source")
    .eq("status", "finished")
    .not("highlight_youtube_id", "is", null)
    .order("kickoff_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (matches ?? []) as MatchRow[];

  if (args.limit) {
    rows.splice(args.limit);
  }

  const matchIds = rows.map((r) => r.id);

  const { data: externalRefs } = await admin
    .from("external_id_map")
    .select("external_key, source_code, metadata, internal_id")
    .in("internal_id", matchIds)
    .eq("internal_table", "matches")
    .in("source_code", ["youtube_fifa", "youtube_replay", "youtube_rtve_teledeporte", "youtube_dazn_es"]);

  const sourcesByMatch = new Map<string, { sourceCode: HighlightSourceCode; videoId: string; publishedAt: string }[]>();
  for (const ref of (externalRefs ?? []) as ExternalRefRow[]) {
    if (!ref.external_key) continue;
    if (!ref.metadata?.published_at) continue;
    const list = sourcesByMatch.get(ref.internal_id);
    const entry = {
      sourceCode: ref.source_code,
      videoId: ref.external_key,
      publishedAt: ref.metadata.published_at,
    };
    if (list) {
      list.push(entry);
    } else {
      sourcesByMatch.set(ref.internal_id, [entry]);
    }
  }

  const result = {
    scanned: rows.length,
    changed: 0,
    unchanged: 0,
    skipped: 0,
    errors: [] as string[],
    dryRun: args.dryRun,
  };

  for (const match of rows) {
    const label = `${match.home_team} vs ${match.away_team}`;
    const matchSources = sourcesByMatch.get(match.id) ?? [];
    if (!matchSources.length) {
      result.skipped += 1;
      console.log(`SKIP ${label} — sin fuentes alternativas en external_id_map`);
      continue;
    }

    const best = bestSource(matchSources);
    if (!best) {
      result.skipped += 1;
      console.log(`SKIP ${label} — no se pudo determinar mejor fuente`);
      continue;
    }

    const currentPriority = match.highlight_source ? SOURCE_PRIORITY[match.highlight_source] ?? 0 : 0;
    const bestPriority = SOURCE_PRIORITY[best.sourceCode] ?? 0;

    if (best.videoId === match.highlight_youtube_id && best.sourceCode === match.highlight_source) {
      result.unchanged += 1;
      continue;
    }

    if (bestPriority < currentPriority) {
      result.unchanged += 1;
      continue;
    }

    if (args.dryRun) {
      console.log(
        `[dry-run] ${label}: ${match.highlight_source ?? "?"} → ${best.sourceCode} (${best.videoId})`,
      );
      result.changed += 1;
      continue;
    }

    try {
      const { error: updateError } = await admin
        .from("matches")
        .update({
          highlight_youtube_id: best.videoId,
          highlight_published_at: best.publishedAt,
          highlight_source: best.sourceCode,
        })
        .eq("id", match.id);

      if (updateError) {
        result.errors.push(`${match.id}: ${updateError.message}`);
        console.error(`ERR ${label}: ${updateError.message}`);
      } else {
        result.changed += 1;
        console.log(`OK ${label}: ${match.highlight_source ?? "?"} → ${best.sourceCode}`);
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
