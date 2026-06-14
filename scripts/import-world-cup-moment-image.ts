/**
 * Descarga una imagen para un momento del catálogo y la guarda en public/images/quiz/historic/.
 */
import { writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseScriptCli, logCliOptions } from "@/lib/scripts/cli";
import {
  downloadMomentImage,
  guessImageExtension,
  readScriptArg,
  saveMomentImageFile,
} from "@/lib/quiz/moment-image-download";
import {
  DEFAULT_MOMENTS_PATH,
  loadWorldCupMomentsCatalog,
  parseWorldCupMomentsCatalog,
  syncMomentStatuses,
} from "@/lib/quiz/world-cup-moments";

const PUBLIC_DIR = resolve(process.cwd(), "public");

async function main() {
  const argv = process.argv.slice(2);
  const opts = parseScriptCli(argv);
  logCliOptions("import-world-cup-moment-image", opts);

  const momentId = readScriptArg(argv, "--id");
  if (!momentId) {
    throw new Error("Falta --id=<moment_id> (ej. wc1986-maradona-cup)");
  }

  const catalogPath = resolve(readScriptArg(argv, "--catalog") ?? DEFAULT_MOMENTS_PATH);
  const catalog = loadWorldCupMomentsCatalog(catalogPath);
  const moment = catalog.moments.find((item) => item.id === momentId);
  if (!moment) {
    throw new Error(`Momento no encontrado: ${momentId}`);
  }

  const url = readScriptArg(argv, "--url") ?? moment.source_url;
  if (!url?.startsWith("https://")) {
    throw new Error(
      `Falta URL https. Ejecuta quiz:discover-moment-images o pasa --url=... para ${momentId}.`
    );
  }

  if (opts.dryRun) {
    console.log(`Dry-run: descargaría ${url}`);
    console.log(`         → ${moment.local_path}`);
    return;
  }

  console.log(`Descargando ${momentId}…`);
  const { bytes, contentType } = await downloadMomentImage(url);
  const finalExt = guessImageExtension(contentType, url);
  const finalRelative = moment.local_path.replace(/\.[a-z0-9]+$/i, finalExt);
  const finalAbsolute = resolve(PUBLIC_DIR, finalRelative.replace(/^\//, ""));

  saveMomentImageFile(finalAbsolute, bytes);
  console.log(`Guardado: ${finalRelative} (${bytes.length} bytes)`);

  const raw = JSON.parse(readFileSync(catalogPath, "utf8")) as unknown;
  const parsed = parseWorldCupMomentsCatalog(raw);
  const updatedMoments = parsed.moments.map((item) => {
    if (item.id !== momentId) return item;
    return {
      ...item,
      local_path: finalRelative,
      source_url: url,
      status: "ready" as const,
    };
  });
  const synced = syncMomentStatuses({ version: 1, moments: updatedMoments });
  writeFileSync(catalogPath, `${JSON.stringify(synced, null, 2)}\n`, "utf8");
  console.log(`Catálogo actualizado: ${momentId} → ready`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
