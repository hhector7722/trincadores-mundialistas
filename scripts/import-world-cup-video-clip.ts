/**
 * Importa un clip local para un momento de vídeo del catálogo.
 *
 * Modos:
 *   --from-local=public/icons/gabri-video.mp4   copia/transcodifica un MP4 existente
 *   --url=https://youtube.com/watch?v=...       requiere yt-dlp + ffmpeg en PATH
 *
 * Opciones:
 *   --id=<moment_id>          obligatorio
 *   --start=<segundos>        inicio del clip en la fuente (default: clip_start_seconds del JSON o 0)
 *   --duration=<segundos>     duración del clip (default: clip_duration_seconds del JSON o 12)
 *   --stop-at=<segundos>      segundo de pausa en el quiz (default: stop_at_seconds del JSON)
 */
import { copyFileSync, existsSync, readFileSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { parseScriptCli, logCliOptions } from "@/lib/scripts/cli";
import {
  DEFAULT_VIDEO_MOMENTS_PATH,
  ensureVideoMomentDirectory,
  loadWorldCupVideoMomentsCatalog,
  saveWorldCupVideoMomentsCatalog,
  syncVideoMomentStatuses,
} from "@/lib/quiz/world-cup-video-moments.server";

function readScriptArg(argv: string[], flag: string): string | undefined {
  const prefix = `${flag}=`;
  const hit = argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : undefined;
}

function commandExists(command: string): boolean {
  try {
    if (process.platform === "win32") {
      execFileSync("where", [command], { stdio: "ignore" });
    } else {
      execFileSync("which", [command], { stdio: "ignore" });
    }
    return true;
  } catch {
    return false;
  }
}

function parseNumberArg(value: string | undefined, fallback: number | null): number {
  if (value === undefined) return fallback ?? 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Valor numérico inválido: ${value}`);
  }
  return parsed;
}

function transcodeClip(inputPath: string, outputPath: string, duration: number) {
  if (!commandExists("ffmpeg")) {
    copyFileSync(inputPath, outputPath);
    return;
  }

  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      inputPath,
      "-t",
      String(duration),
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      outputPath,
    ],
    { stdio: "inherit" }
  );
}

function downloadYoutubeSection(
  url: string,
  outputPath: string,
  start: number,
  duration: number
) {
  if (!commandExists("yt-dlp")) {
    throw new Error("yt-dlp no está en PATH. Instálalo o usa --from-local=...");
  }

  const tempPath = `${outputPath}.source.mp4`;
  const end = start + duration;
  const section = `*${formatSectionTime(start)}-${formatSectionTime(end)}`;

  execFileSync(
    "yt-dlp",
    [
      "--no-playlist",
      "--force-keyframes-at-cuts",
      "--download-sections",
      section,
      "-f",
      "bv*+ba/b",
      "-o",
      tempPath,
      url,
    ],
    { stdio: "inherit" }
  );

  transcodeClip(tempPath, outputPath, duration);

  try {
    unlinkSync(tempPath);
  } catch {
    // ignorar
  }
}

function formatSectionTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function main() {
  const argv = process.argv.slice(2);
  const opts = parseScriptCli(argv);
  logCliOptions("import-world-cup-video-clip", opts);

  const momentId = readScriptArg(argv, "--id");
  if (!momentId) {
    throw new Error("Falta --id=<moment_id> (ej. wc2010-iniesta-final-goal).");
  }

  const catalogPath = resolve(readScriptArg(argv, "--catalog") ?? DEFAULT_VIDEO_MOMENTS_PATH);
  const catalog = loadWorldCupVideoMomentsCatalog(catalogPath);
  const index = catalog.moments.findIndex((item) => item.id === momentId);
  if (index < 0) {
    throw new Error(`Momento de vídeo no encontrado: ${momentId}`);
  }

  const moment = catalog.moments[index]!;
  const outputPath = ensureVideoMomentDirectory(moment);
  const start = parseNumberArg(readScriptArg(argv, "--start"), moment.clip_start_seconds ?? 0);
  const duration = parseNumberArg(
    readScriptArg(argv, "--duration"),
    moment.clip_duration_seconds ?? 12
  );
  const stopAt = parseNumberArg(readScriptArg(argv, "--stop-at"), moment.stop_at_seconds);

  const fromLocal = readScriptArg(argv, "--from-local");
  const url = readScriptArg(argv, "--url") ?? moment.source_url ?? undefined;

  if (fromLocal) {
    const sourcePath = resolve(process.cwd(), fromLocal);
    if (!existsSync(sourcePath)) {
      throw new Error(`Archivo local no encontrado: ${sourcePath}`);
    }
    transcodeClip(sourcePath, outputPath, duration);
  } else if (url?.startsWith("https://")) {
    downloadYoutubeSection(url, outputPath, start, duration);
  } else {
    throw new Error(
      "Pasa --from-local=public/... o --url=https://... (YouTube) con yt-dlp y ffmpeg instalados."
    );
  }

  const updated: (typeof catalog.moments)[number] = {
    ...moment,
    stop_at_seconds: stopAt,
    clip_start_seconds: start,
    clip_duration_seconds: duration,
  };
  if (url) updated.source_url = url;

  catalog.moments[index] = updated;
  const synced = syncVideoMomentStatuses(catalog);
  saveWorldCupVideoMomentsCatalog(synced, catalogPath);

  console.log(
    JSON.stringify(
      {
        ok: true,
        momentId,
        outputPath,
        publicUrl: moment.local_path,
        stop_at_seconds: stopAt,
        status: synced.moments[index]?.status,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
