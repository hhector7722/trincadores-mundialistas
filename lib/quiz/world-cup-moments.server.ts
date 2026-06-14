import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  parseWorldCupMomentsCatalog,
  type WorldCupMoment,
  type WorldCupMomentsCatalog,
} from "@/lib/quiz/world-cup-moments";

export const DEFAULT_MOMENTS_PATH = resolve(
  process.cwd(),
  "data/quiz/images/world-cup-moments.json"
);

export const PUBLIC_MOMENTS_DIR = resolve(process.cwd(), "public");

export function loadWorldCupMomentsCatalog(path = DEFAULT_MOMENTS_PATH): WorldCupMomentsCatalog {
  const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
  return parseWorldCupMomentsCatalog(raw);
}

export function momentImageExists(moment: WorldCupMoment, publicDir = PUBLIC_MOMENTS_DIR): boolean {
  const relative = moment.local_path.replace(/^\//, "");
  return existsSync(resolve(publicDir, relative));
}

export function syncMomentStatuses(
  catalog: WorldCupMomentsCatalog,
  publicDir = PUBLIC_MOMENTS_DIR
): WorldCupMomentsCatalog {
  return {
    version: 1,
    moments: catalog.moments.map((moment) => ({
      ...moment,
      status: momentImageExists(moment, publicDir) ? "ready" : "pending",
    })),
  };
}

export function filterReadyMoments(
  moments: WorldCupMoment[],
  publicDir = PUBLIC_MOMENTS_DIR
): WorldCupMoment[] {
  return moments.filter((moment) => momentImageExists(moment, publicDir));
}

export function pickMomentByIdOnDisk(
  catalog: WorldCupMomentsCatalog,
  momentId: string,
  opts?: { readyOnly?: boolean; publicDir?: string }
): WorldCupMoment | null {
  const publicDir = opts?.publicDir ?? PUBLIC_MOMENTS_DIR;
  const moment = catalog.moments.find((item) => item.id === momentId) ?? null;
  if (!moment) return null;
  if (opts?.readyOnly && !momentImageExists(moment, publicDir)) return null;
  return moment;
}
