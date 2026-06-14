/**
 * Importa en lote todos los JPG de siluetas desde una carpeta.
 * Espera archivos: {momentId}-silhouette.jpg
 *
 * npm run quiz:import-lab-silhouettes -- --from-dir=./siluetas
 */

import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  DEFAULT_SILUETAS_DIR,
  expectedSilhouetteFileName,
  importLabSilhouetteFile,
} from "@/lib/quiz/lab/import-lab-silhouette";
import { listPlayerMomentsForLab } from "@/lib/quiz/lab/materialize-assets.server";

function readArg(prefix: string): string | null {
  const match = process.argv.find((arg) => arg.startsWith(`${prefix}=`));
  return match ? match.slice(prefix.length + 1).trim() : null;
}

function main() {
  const fromDir = readArg("--from-dir") ?? DEFAULT_SILUETAS_DIR;
  const dir = resolve(process.cwd(), fromDir);
  const files = readdirSync(dir).filter((name) => name.endsWith("-silhouette.jpg"));

  const playerIds = new Set(listPlayerMomentsForLab().map((moment) => moment.id));
  const imported: string[] = [];
  const skipped: string[] = [];
  const failures: Array<{ file: string; error: string }> = [];

  for (const file of files.sort()) {
    const momentId = file.replace(/-silhouette\.jpg$/, "");
    if (!playerIds.has(momentId)) {
      skipped.push(file);
      continue;
    }

    try {
      const url = importLabSilhouetteFile(momentId, resolve(dir, file));
      imported.push(`${momentId} → ${url}`);
      console.log(`OK ${momentId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ file, error: message });
      console.error(`FAIL ${file}: ${message}`);
    }
  }

  const expected = [...playerIds].map((id) => expectedSilhouetteFileName(id));
  const missing = expected.filter(
    (name) => !files.includes(name) && !imported.some((line) => line.startsWith(name.replace("-silhouette.jpg", "")))
  );

  console.log(
    JSON.stringify(
      {
        fromDir,
        filesFound: files.length,
        imported: imported.length,
        skipped,
        failures,
        missingInFolder: missing,
      },
      null,
      2
    )
  );

  if (failures.length) process.exit(1);
}

main();
