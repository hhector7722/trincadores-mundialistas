/**
 * Importa una silueta generada manualmente (p. ej. en ChatGPT) al laboratorio.
 *
 * Flujo manual:
 * 1. Elige el momento (imagen histórica en public/images/quiz/historic/)
 * 2. Sube la foto a ChatGPT y pega el prompt de buildSilhouetteImagePrompt
 * 3. Descarga el JPG resultante
 * 4. Importa con este script
 *
 * npm run quiz:import-lab-silhouette -- --id=wc1998-zidane-final --from=./silueta.jpg
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { buildSilhouetteImagePrompt } from "@/lib/quiz/lab/openai-silhouette.server";
import { importLabSilhouetteFile, normalizeLabSilhouetteMomentId } from "@/lib/quiz/lab/import-lab-silhouette";
import { getWorldCupMomentsCatalog } from "@/lib/quiz/world-cup-moments-catalog";
import { pickMomentById } from "@/lib/quiz/world-cup-moments";

function readArg(prefix: string): string | null {
  const match = process.argv.find((arg) => arg.startsWith(`${prefix}=`));
  return match ? match.slice(prefix.length + 1).trim() : null;
}

function main() {
  const momentId = normalizeLabSilhouetteMomentId(readArg("--id") ?? "");
  const fromPath = readArg("--from");
  const printPrompt = process.argv.includes("--print-prompt");

  if (!momentId) {
    console.error("Falta --id=<moment_id> (ej. wc1998-zidane-final)");
    process.exit(1);
  }

  const catalog = getWorldCupMomentsCatalog();
  const moment = pickMomentById(catalog, momentId, { readyOnly: true });
  if (!moment) {
    console.error(`Momento no encontrado o sin imagen histórica: ${momentId}`);
    process.exit(1);
  }

  if (printPrompt) {
    console.log(buildSilhouetteImagePrompt(moment));
    process.exit(0);
  }

  if (!fromPath) {
    console.error("Falta --from=<ruta-al-jpg> o usa --print-prompt para copiar el prompt.");
    process.exit(1);
  }

  const source = resolve(fromPath);
  if (!existsSync(source)) {
    console.error(`Archivo no encontrado: ${source}`);
    process.exit(1);
  }

  const publicUrl = importLabSilhouetteFile(momentId, source);

  console.log(`OK ${momentId} silhouette → ${publicUrl}`);
  console.log(`Reveal (original): imagen histórica del catálogo, sin cambios.`);
}

main();
