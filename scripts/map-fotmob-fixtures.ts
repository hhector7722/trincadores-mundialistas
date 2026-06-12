/**
 * Mapea partidos OpenFootball → match IDs de FotMob en external_id_map.
 * El cron `/api/cron/fotmob-map-fixtures` reutiliza la misma lógica.
 */
import { syncFotmobFixtures } from "@/lib/fotmob/sync-fotmob-fixtures";
import { parseScriptCli, logCliOptions } from "@/lib/scripts/cli";
import { assertImportAllowed } from "@/lib/scripts/env-guard";
import { createAdminClient } from "@/lib/scripts/supabase-admin";

async function main() {
  assertImportAllowed();
  const opts = parseScriptCli(process.argv.slice(2));
  logCliOptions("map-fotmob-fixtures", opts);

  const admin = createAdminClient();
  const result = await syncFotmobFixtures(admin, { persist: opts.insert && !opts.dryRun });

  console.log(
    `[map-fotmob-fixtures] internos=${result.internalTotal} ya_mapeados=${result.alreadyMapped} candidatos=${result.candidates}`,
  );
  console.log(
    `[map-fotmob-fixtures] fotmob=${result.fotmobFixturesLoaded} fechas=${result.datesFetched} nuevos=${result.newlyMapped} pendientes=${result.stillUnmapped}`,
  );

  if (result.skipped) {
    console.log("[map-fotmob-fixtures] todos los partidos ya tienen mapeo FotMob.");
    return;
  }

  if (opts.dryRun || !opts.insert) {
    console.log("[map-fotmob-fixtures] dry-run: no se escribió en BD. Usa --insert para persistir.");
    return;
  }

  console.log(`[map-fotmob-fixtures] external_id_map upsert: ${result.persisted} filas`);

  if (result.errors.length) {
    console.warn("[map-fotmob-fixtures] avisos:");
    for (const message of result.errors) console.warn(`  - ${message}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
