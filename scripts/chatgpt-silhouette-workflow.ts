/**
 * Flujo guiado ChatGPT → import, todo desde terminal.
 *
 * Por momento:
 *   npm run quiz:chatgpt-silhouette -- --id=wc2018-pavard-volley
 *
 * Lote completo (25):
 *   npm run quiz:chatgpt-silhouette -- --all
 *
 * Solo importar carpeta siluetas/:
 *   npm run quiz:import-lab-silhouettes -- --from-dir=./siluetas
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { basename, resolve } from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { buildSilhouetteImagePrompt } from "@/lib/quiz/lab/openai-silhouette.server";
import { listPlayerMomentsForLab } from "@/lib/quiz/lab/materialize-assets.server";
import {
  DEFAULT_SILUETAS_DIR,
  expectedSilhouetteDownloadPath,
  importLabSilhouetteFile,
  normalizeLabSilhouetteMomentId,
} from "@/lib/quiz/lab/import-lab-silhouette";
import { resolveMomentImageUrl } from "@/lib/quiz/world-cup-moments";

function readArg(prefix: string): string | null {
  const match = process.argv.find((arg) => arg.startsWith(`${prefix}=`));
  return match ? match.slice(prefix.length + 1).trim() : null;
}

function copyToClipboard(text: string): boolean {
  try {
    if (process.platform === "win32") {
      const tempFile = join(tmpdir(), `lab-silhouette-prompt-${Date.now()}.txt`);
      writeFileSync(tempFile, text, "utf8");
      try {
        execSync(
          `powershell -NoProfile -Command "Get-Content -Raw -LiteralPath '${tempFile.replace(/'/g, "''")}' | Set-Clipboard"`,
          { stdio: "ignore" }
        );
      } finally {
        unlinkSync(tempFile);
      }
      return true;
    }
    if (process.platform === "darwin") {
      execSync("pbcopy", { input: text });
      return true;
    }
    execSync("xclip -selection clipboard", { input: text });
    return true;
  } catch {
    return false;
  }
}

function openFile(absolutePath: string): boolean {
  try {
    if (process.platform === "win32") {
      execSync(`start "" "${absolutePath.replace(/"/g, '\\"')}"`, { shell: true, stdio: "ignore" });
      return true;
    }
    if (process.platform === "darwin") {
      execSync(`open "${absolutePath}"`, { stdio: "ignore" });
      return true;
    }
    execSync(`xdg-open "${absolutePath}"`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function openUrl(url: string): boolean {
  try {
    if (process.platform === "win32") {
      execSync(`start "" "${url}"`, { shell: true, stdio: "ignore" });
      return true;
    }
    if (process.platform === "darwin") {
      execSync(`open "${url}"`, { stdio: "ignore" });
      return true;
    }
    execSync(`xdg-open "${url}"`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function processMoment(
  index: number,
  total: number,
  momentId: string,
  fromDir: string,
  rl: ReturnType<typeof createInterface>
): Promise<"imported" | "skipped" | "failed"> {
  const moments = listPlayerMomentsForLab();
  const moment = moments.find((item) => item.id === momentId);
  if (!moment) {
    console.error(`Momento no encontrado: ${momentId}`);
    return "failed";
  }

  const historicUrl = resolveMomentImageUrl(moment);
  if (!historicUrl) {
    console.error(`${momentId}: sin imagen histórica`);
    return "failed";
  }

  const historicAbs = resolve(process.cwd(), "public", historicUrl.replace(/^\//, ""));
  const downloadPath = expectedSilhouetteDownloadPath(momentId, fromDir);
  const prompt = buildSilhouetteImagePrompt(moment);

  console.log("\n" + "=".repeat(72));
  console.log(`[${index + 1}/${total}] ${moment.label} (${moment.year})`);
  console.log(`ID: ${momentId}`);
  console.log(`Jugador a siluetear: ${moment.quiz.correct_option}`);
  console.log(`Foto: public${historicUrl}`);
  console.log(`Guardar descarga como: ${basename(downloadPath)}`);
  console.log("=".repeat(72));

  mkdirSync(resolve(downloadPath, ".."), { recursive: true });

  const copied = copyToClipboard(prompt);
  console.log(copied ? "✓ Prompt copiado al portapapeles." : "⚠ No se pudo copiar el prompt (cópialo abajo).");
  if (!copied) {
    console.log("\n--- PROMPT ---\n");
    console.log(prompt);
    console.log("\n--------------\n");
  }

  if (existsSync(historicAbs)) {
    const opened = openFile(historicAbs);
    console.log(opened ? "✓ Imagen abierta en el visor del sistema." : `  Abre manualmente: ${historicAbs}`);
  } else {
    console.error(`  Falta archivo: ${historicAbs}`);
  }

  openUrl("https://chatgpt.com/");
  console.log("\nPasos en ChatGPT:");
  console.log("  1. Nueva conversación (o la misma)");
  console.log("  2. Adjunta la foto que se abrió arriba");
  console.log("  3. Pega el prompt (Ctrl+V)");
  console.log(`  4. Descarga el JPG → guárdalo en:\n     ${downloadPath}`);

  if (existsSync(downloadPath)) {
    console.log(`\n✓ Ya existe ${basename(downloadPath)} — importando...`);
    try {
      const url = importLabSilhouetteFile(momentId, downloadPath);
      console.log(`✓ Importado → ${url}`);
      return "imported";
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      return "failed";
    }
  }

  const answer = await rl.question(
    "\nCuando hayas guardado el JPG en siluetas/, pulsa Enter (s=omitir, q=salir): "
  );
  const trimmed = answer.trim().toLowerCase();

  if (trimmed === "q") {
    console.log("Saliendo del lote.");
    process.exit(0);
  }
  if (trimmed === "s") {
    console.log("Omitido.");
    return "skipped";
  }

  if (!existsSync(downloadPath)) {
    console.error(`No encuentro el archivo: ${downloadPath}`);
    console.error(`Guárdalo con ese nombre exacto en la carpeta siluetas/.`);
    return "failed";
  }

  try {
    const url = importLabSilhouetteFile(momentId, downloadPath);
    console.log(`✓ Importado → ${url}`);
    return "imported";
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return "failed";
  }
}

async function main() {
  const momentIdRaw = readArg("--id");
  const momentId = momentIdRaw ? normalizeLabSilhouetteMomentId(momentIdRaw) : null;
  const runAll = process.argv.includes("--all");
  const fromDir = readArg("--from-dir") ?? DEFAULT_SILUETAS_DIR;

  if (!momentId && !runAll) {
    console.log("Uso:");
    console.log("  npm run quiz:chatgpt-silhouette -- --id=wc2018-pavard-volley");
    console.log("  npm run quiz:chatgpt-silhouette -- --id=wc2014-james-volley-silhouette.jpg  (también válido)");
    console.log("  npm run quiz:chatgpt-silhouette -- --all");
    console.log("  npm run quiz:chatgpt-silhouette -- --all --from-dir=./siluetas");
    console.log("\nImportar sin ChatGPT:");
    console.log("  npm run quiz:import-lab-silhouettes -- --from-dir=./siluetas");
    process.exit(1);
  }

  const rl = createInterface({ input, output });

  let ids: string[] = [];
  if (runAll) {
    ids = listPlayerMomentsForLab()
      .sort((a, b) => a.year - b.year || a.id.localeCompare(b.id))
      .map((moment) => moment.id);
  } else if (momentId) {
    ids = [momentId];
  }

  const stats = { imported: 0, skipped: 0, failed: 0 };

  for (let i = 0; i < ids.length; i += 1) {
    const result = await processMoment(i, ids.length, ids[i]!, fromDir, rl);
    stats[result] += 1;
  }

  rl.close();

  console.log("\n--- Resumen ---");
  console.log(JSON.stringify(stats, null, 2));
  if (stats.failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
