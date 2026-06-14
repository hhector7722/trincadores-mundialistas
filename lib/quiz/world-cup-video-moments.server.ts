import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  parseWorldCupVideoMomentsCatalog,
  type WorldCupVideoMoment,
  type WorldCupVideoMomentsCatalog,
} from "@/lib/quiz/world-cup-video-moments";

export const DEFAULT_VIDEO_MOMENTS_PATH = resolve(
  process.cwd(),
  "data/quiz/videos/world-cup-video-moments.json"
);

export const PUBLIC_VIDEO_DIR = resolve(process.cwd(), "public");

export function loadWorldCupVideoMomentsCatalog(
  path = DEFAULT_VIDEO_MOMENTS_PATH
): WorldCupVideoMomentsCatalog {
  const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
  return parseWorldCupVideoMomentsCatalog(raw);
}

export function videoMomentFileExists(
  moment: WorldCupVideoMoment,
  publicDir = PUBLIC_VIDEO_DIR
): boolean {
  const relative = moment.local_path.replace(/^\//, "");
  return existsSync(resolve(publicDir, relative));
}

export function syncVideoMomentStatuses(
  catalog: WorldCupVideoMomentsCatalog,
  publicDir = PUBLIC_VIDEO_DIR
): WorldCupVideoMomentsCatalog {
  return {
    version: 1,
    moments: catalog.moments.map((moment) => ({
      ...moment,
      status: videoMomentFileExists(moment, publicDir) ? "ready" : "pending",
    })),
  };
}

export function saveWorldCupVideoMomentsCatalog(
  catalog: WorldCupVideoMomentsCatalog,
  path = DEFAULT_VIDEO_MOMENTS_PATH
): void {
  writeFileSync(path, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
}

export function ensureVideoMomentDirectory(moment: WorldCupVideoMoment, publicDir = PUBLIC_VIDEO_DIR) {
  const relative = moment.local_path.replace(/^\//, "");
  const absolute = resolve(publicDir, relative);
  mkdirSync(dirname(absolute), { recursive: true });
  return absolute;
}
