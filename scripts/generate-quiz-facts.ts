/**
 * Genera quiz_facts_worldcup desde wc_historic_* (solo torneos masculinos).
 * Por defecto: preview en consola.
 * --insert / --upsert: upsert idempotente en Supabase.
 * --dry-run: nunca escribe en DB.
 */
import { buildWorldcupFactsFromHistoric } from "@/lib/quiz/generate-worldcup-facts";
import {
  shouldPersistFacts,
  upsertWorldcupFacts,
} from "@/lib/quiz/quiz-facts-repository";
import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { parseScriptCli, logCliOptions } from "@/lib/scripts/cli";
import type { QuizFactWorldcupRow } from "@/lib/worldcup-data/types";

function filterPreview(
  facts: QuizFactWorldcupRow[],
  opts: { category: string | null; limit: number | null }
): QuizFactWorldcupRow[] {
  let output = facts;
  if (opts.category && opts.category !== "all") {
    output = facts.filter((f) => f.category === opts.category);
  }
  if (opts.limit) output = output.slice(0, opts.limit);
  return output;
}

async function main() {
  const opts = parseScriptCli(process.argv.slice(2));
  logCliOptions("generate-quiz-facts", opts);

  const admin = createAdminClient();
  const facts = await buildWorldcupFactsFromHistoric(admin);

  console.log(`\nGenerados: ${facts.length} facts (Fjelstul, solo masculino)`);

  const preview = filterPreview(facts, opts);
  console.log(`\n=== Quiz facts preview (${preview.length}/${facts.length}) ===\n`);
  for (const fact of preview) {
    console.log(JSON.stringify(fact, null, 2));
    console.log("---");
  }

  if (shouldPersistFacts(opts)) {
    const result = await upsertWorldcupFacts(admin, facts);
    console.log(
      `\nUpsert quiz_facts_worldcup: ${result.upserted} filas (${result.valid.length} válidos, ${result.skipped} omitidos, ${result.duplicateIds} duplicados colapsados)`
    );
    console.log(`Fuente: ${facts[0]?.source_label ?? "Fjelstul"} (${facts[0]?.source_url ?? ""})`);
  } else if (opts.dryRun) {
    console.log("\nDry-run: no se escribió en quiz_facts_worldcup.");
  } else {
    console.log("\nPreview only. Usa --insert para persistir en quiz_facts_worldcup.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
