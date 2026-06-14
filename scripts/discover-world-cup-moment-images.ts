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
  discoverBestMomentImage,
  discoverMomentImageCandidates,
  formatDiscoverSourceLabel,
} from "@/lib/quiz/moment-image-search";
import {
  DEFAULT_MOMENTS_PATH,
  loadWorldCupMomentsCatalog,
  momentImageExists,
  syncMomentStatuses,
} from "@/lib/quiz/world-cup-moments.server";
import { parseWorldCupMomentsCatalog } from "@/lib/quiz/world-cup-moments";
import type { WorldCupMomentDifficulty } from "@/lib/quiz/world-cup-moments";

const PUBLIC_DIR = resolve(process.cwd(), "public");

function sleep(ms: number): Promise<void> {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function shouldProcessMoment(
  moment: WorldCupMoment,
  force: boolean,
  onlyPending: boolean,
  minDifficulty: WorldCupMomentDifficulty | null
): boolean {
  if (momentImageExists(moment, PUBLIC_DIR)) return false;
  if (onlyPending && moment.status === "ready") return false;
  if (!force && moment.source_url?.startsWith("https://")) return false;
  if (minDifficulty) {
    const rank = { hard: 0, medium: 1, easy: 2 } as const;
    if (rank[moment.difficulty] > rank[minDifficulty]) return false;
  }
  return true;
}

async function persistDiscoveredUrl(
  catalogPath: string,
  momentId: string,
  imageUrl: string,
  sourceLabel: string
): Promise<void> {
  const raw = JSON.parse(readFileSync(catalogPath, "utf8")) as unknown;
  const parsed = parseWorldCupMomentsCatalog(raw);
  const updated = {
    version: 1 as const,
    moments: parsed.moments.map((item) =>
      item.id === momentId
        ? { ...item, source_url: imageUrl, source_label: sourceLabel }
        : item
    ),
  };
  writeFileSync(catalogPath, `${JSON.stringify(syncMomentStatuses(updated), null, 2)}\n`, "utf8");
}

async function downloadDiscoveredMoment(
  catalogPath: string,
  moment: WorldCupMoment,
  imageUrl: string
): Promise<string> {
  const { bytes, contentType } = await downloadMomentImage(imageUrl);
  const ext = guessImageExtension(contentType, imageUrl);
  const finalRelative = moment.local_path.replace(/\.[a-z0-9]+$/i, ext);
  const finalAbsolute = resolve(PUBLIC_DIR, finalRelative.replace(/^\//, ""));
  saveMomentImageFile(finalAbsolute, bytes);

  const raw = JSON.parse(readFileSync(catalogPath, "utf8")) as unknown;
  const parsed = parseWorldCupMomentsCatalog(raw);
  const updated = {
    version: 1 as const,
    moments: parsed.moments.map((item) =>
      item.id === moment.id
        ? {
            ...item,
            local_path: finalRelative,
            source_url: imageUrl,
            status: "ready" as const,
          }
        : item
    ),
  };
  writeFileSync(catalogPath, `${JSON.stringify(syncMomentStatuses(updated), null, 2)}\n`, "utf8");
  return finalRelative;
}

async function main() {
  const argv = process.argv.slice(2);
  const opts = parseScriptCli(argv);
  logCliOptions("discover-world-cup-moment-images", opts);

  const catalogPath = resolve(readScriptArg(argv, "--catalog") ?? DEFAULT_MOMENTS_PATH);
  const momentId = readScriptArg(argv, "--id");
  const force = argv.includes("--force");
  const download = argv.includes("--download");
  const preview = argv.includes("--preview");
  const onlyPending = !argv.includes("--all");
  const delayMs = Number(readScriptArg(argv, "--delay") ?? "1200");
  const minDifficultyRaw = readScriptArg(argv, "--difficulty");
  const minDifficulty =
    minDifficultyRaw === "easy" || minDifficultyRaw === "medium" || minDifficultyRaw === "hard"
      ? minDifficultyRaw
      : null;

  const catalog = loadWorldCupMomentsCatalog(catalogPath);
  let targets = catalog.moments.filter((moment) =>
    shouldProcessMoment(moment, force, onlyPending, minDifficulty)
  );

  if (momentId) {
    targets = targets.filter((moment) => moment.id === momentId);
    if (!targets.length) {
      const exists = catalog.moments.some((moment) => moment.id === momentId);
      if (!exists) throw new Error(`Momento no encontrado: ${momentId}`);
      console.log(`Sin trabajo para ${momentId} (ya tiene URL/archivo o usa --force).`);
      return;
    }
  }

  if (opts.limit) targets = targets.slice(0, opts.limit);
  if (!targets.length) {
    console.log("Nada que descubrir. Todos los momentos tienen URL o imagen local.");
    return;
  }

  console.log(`Descubriendo URLs para ${targets.length} momento(s)…`);

  for (const [index, moment] of targets.entries()) {
    console.log(`\n[${index + 1}/${targets.length}] ${moment.id} — ${moment.label}`);

    const candidates = preview
      ? await discoverMomentImageCandidates(moment, { maxCandidates: 8 })
      : null;
    const best = preview ? candidates?.[0] ?? null : await discoverBestMomentImage(moment);

    if (preview && candidates?.length) {
      for (const [rank, candidate] of candidates.entries()) {
        console.log(
          `  #${rank + 1} score=${candidate.score} [${candidate.source}] ${candidate.title}`
        );
        console.log(`      ${candidate.imageUrl}`);
      }
    }

    if (!best) {
      console.log("  ✗ Sin candidato viable");
      continue;
    }

    const sourceLabel = formatDiscoverSourceLabel(best);
    console.log(`  ✓ score=${best.score} ${sourceLabel}`);
    console.log(`    query: ${best.query}`);
    console.log(`    url:   ${best.imageUrl}`);

    if (opts.dryRun) continue;

    await persistDiscoveredUrl(catalogPath, moment.id, best.imageUrl, sourceLabel);

    if (download) {
      try {
        const savedPath = await downloadDiscoveredMoment(catalogPath, moment, best.imageUrl);
        console.log(`    descargado → ${savedPath}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`    ⚠ URL guardada pero descarga falló: ${message}`);
      }
    }

    if (index < targets.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  if (!opts.dryRun) {
    console.log(`\nCatálogo actualizado: ${catalogPath}`);
    if (!download) {
      console.log("Tip: añade --download para guardar las imágenes en public/");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
