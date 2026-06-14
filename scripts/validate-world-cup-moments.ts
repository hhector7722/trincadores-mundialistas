/**
 * Valida el catálogo de momentos y sincroniza status según archivos en public/.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseScriptCli, logCliOptions } from "@/lib/scripts/cli";
import {
  DEFAULT_MOMENTS_PATH,
  loadWorldCupMomentsCatalog,
  syncMomentStatuses,
} from "@/lib/quiz/world-cup-moments";

async function main() {
  const argv = process.argv.slice(2);
  const opts = parseScriptCli(argv);
  logCliOptions("validate-world-cup-moments", opts);

  const catalogPath =
    argv.find((arg) => arg.startsWith("--catalog="))?.slice("--catalog=".length) ??
    DEFAULT_MOMENTS_PATH;
  const write = argv.includes("--write");

  const catalog = loadWorldCupMomentsCatalog(resolve(catalogPath));
  const synced = syncMomentStatuses(catalog);

  const ready = synced.moments.filter((m) => m.status === "ready");
  const pending = synced.moments.filter((m) => m.status === "pending");

  console.log(`Momentos: ${synced.moments.length} total, ${ready.length} ready, ${pending.length} pending`);

  if (ready.length) {
    console.log("\nReady:");
    for (const moment of ready) {
      console.log(`  ✓ ${moment.id} → ${moment.local_path}`);
    }
  }

  if (pending.length) {
    console.log("\nPending (falta archivo en public/):");
    for (const moment of pending) {
      console.log(`  · ${moment.id} → ${moment.local_path}`);
    }
  }

  if (write) {
    writeFileSync(catalogPath, `${JSON.stringify(synced, null, 2)}\n`, "utf8");
    console.log(`\nActualizado status en ${catalogPath}`);
  } else if (pending.length) {
    console.log("\nTip: npm run quiz:validate-moments -- --write");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
