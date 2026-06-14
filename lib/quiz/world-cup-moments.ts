import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const WORLD_CUP_MOMENTS_MIN_YEAR = 1970;

export const WORLD_CUP_MOMENT_TYPES = [
  "goal",
  "celebration",
  "action",
  "final",
  "iconic",
  "save",
] as const;

export type WorldCupMomentType = (typeof WORLD_CUP_MOMENT_TYPES)[number];

export type WorldCupMomentStatus = "pending" | "ready";

export type WorldCupMomentAnswerType = "year" | "team" | "player";

export type WorldCupMomentQuizHints = {
  prompt: string;
  answer_type: WorldCupMomentAnswerType;
  correct_option: string;
  options: [string, string, string, string];
  blur_start_px: number;
  reveal_seconds: number;
};

export type WorldCupMoment = {
  id: string;
  year: number;
  label: string;
  moment_type: WorldCupMomentType;
  teams: string[];
  players: string[];
  competition: string;
  local_path: string;
  source_url: string | null;
  source_label: string;
  status: WorldCupMomentStatus;
  image_alt: string;
  quiz: WorldCupMomentQuizHints;
};

export type WorldCupMomentsCatalog = {
  version: 1;
  moments: WorldCupMoment[];
};

export const DEFAULT_MOMENTS_PATH = resolve(
  process.cwd(),
  "data/quiz/images/world-cup-moments.json"
);

const PUBLIC_DIR = resolve(process.cwd(), "public");

const MOMENT_TYPES = new Set<WorldCupMomentType>(WORLD_CUP_MOMENT_TYPES);
const ANSWER_TYPES = new Set<WorldCupMomentAnswerType>(["year", "team", "player"]);
const STATUSES = new Set<WorldCupMomentStatus>(["pending", "ready"]);

function readString(row: Record<string, unknown>, key: string, index: number): string {
  const value = row[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`moments[${index}].${key} vacio o invalido.`);
  }
  return value.trim();
}

function readStringArray(row: Record<string, unknown>, key: string, index: number): string[] {
  const value = row[key];
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`moments[${index}].${key} debe ser un array no vacio.`);
  }
  const items = value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
  if (items.length === 0) {
    throw new Error(`moments[${index}].${key} debe tener al menos un valor.`);
  }
  return items;
}

function readLocalPath(value: unknown, index: number): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`moments[${index}].local_path vacio.`);
  }
  const path = value.trim();
  if (!path.startsWith("/images/quiz/historic/")) {
    throw new Error(
      `moments[${index}].local_path debe empezar por /images/quiz/historic/ (recibido: ${path}).`
    );
  }
  if (!/\.(jpe?g|webp|png)$/i.test(path)) {
    throw new Error(`moments[${index}].local_path debe terminar en .jpg, .jpeg, .png o .webp.`);
  }
  return path;
}

function validateQuizHints(raw: unknown, index: number): WorldCupMomentQuizHints {
  if (!raw || typeof raw !== "object") {
    throw new Error(`moments[${index}].quiz invalido.`);
  }
  const row = raw as Record<string, unknown>;
  const prompt = readString(row, "prompt", index);
  const answerType = row.answer_type;
  if (!ANSWER_TYPES.has(answerType as WorldCupMomentAnswerType)) {
    throw new Error(`moments[${index}].quiz.answer_type invalido.`);
  }
  const correctOption = readString(row, "correct_option", index);
  if (!Array.isArray(row.options) || row.options.length !== 4) {
    throw new Error(`moments[${index}].quiz.options debe tener exactamente 4 strings.`);
  }
  const options = row.options.map((opt, optIndex) => {
    if (typeof opt !== "string" || !opt.trim()) {
      throw new Error(`moments[${index}].quiz.options[${optIndex}] invalido.`);
    }
    return opt.trim();
  }) as [string, string, string, string];

  const blurStartPx =
    typeof row.blur_start_px === "number" && row.blur_start_px >= 0
      ? Math.floor(row.blur_start_px)
      : 24;
  const revealSeconds =
    typeof row.reveal_seconds === "number" && row.reveal_seconds > 0
      ? row.reveal_seconds
      : 8;

  return {
    prompt,
    answer_type: answerType as WorldCupMomentAnswerType,
    correct_option: correctOption,
    options,
    blur_start_px: blurStartPx,
    reveal_seconds: revealSeconds,
  };
}

export function validateWorldCupMoment(raw: unknown, index: number): WorldCupMoment {
  if (!raw || typeof raw !== "object") {
    throw new Error(`moments[${index}]: objeto invalido.`);
  }
  const row = raw as Record<string, unknown>;
  const id = readString(row, "id", index);
  const year = row.year;
  if (typeof year !== "number" || !Number.isInteger(year) || year < WORLD_CUP_MOMENTS_MIN_YEAR) {
    throw new Error(
      `moments[${index}].year debe ser entero >= ${WORLD_CUP_MOMENTS_MIN_YEAR}.`
    );
  }
  const momentType = row.moment_type;
  if (!MOMENT_TYPES.has(momentType as WorldCupMomentType)) {
    throw new Error(`moments[${index}].moment_type invalido.`);
  }
  const status = row.status;
  if (!STATUSES.has(status as WorldCupMomentStatus)) {
    throw new Error(`moments[${index}].status invalido.`);
  }

  const sourceUrlRaw = row.source_url;
  const sourceUrl =
    sourceUrlRaw === null || sourceUrlRaw === undefined
      ? null
      : typeof sourceUrlRaw === "string" && sourceUrlRaw.trim().startsWith("https://")
        ? sourceUrlRaw.trim()
        : null;
  if (sourceUrlRaw != null && sourceUrlRaw !== "" && !sourceUrl) {
    throw new Error(`moments[${index}].source_url debe ser https o null.`);
  }

  return {
    id,
    year,
    label: readString(row, "label", index),
    moment_type: momentType as WorldCupMomentType,
    teams: readStringArray(row, "teams", index),
    players: readStringArray(row, "players", index),
    competition: readString(row, "competition", index),
    local_path: readLocalPath(row.local_path, index),
    source_url: sourceUrl,
    source_label: readString(row, "source_label", index),
    status: status as WorldCupMomentStatus,
    image_alt: readString(row, "image_alt", index),
    quiz: validateQuizHints(row.quiz, index),
  };
}

export function parseWorldCupMomentsCatalog(raw: unknown): WorldCupMomentsCatalog {
  if (!raw || typeof raw !== "object") {
    throw new Error("El catalogo de momentos debe ser un objeto.");
  }
  const root = raw as Record<string, unknown>;
  if (root.version !== 1) {
    throw new Error("world-cup-moments.json: version debe ser 1.");
  }
  if (!Array.isArray(root.moments)) {
    throw new Error("world-cup-moments.json: moments debe ser un array.");
  }

  const moments = root.moments.map((item, index) => validateWorldCupMoment(item, index));
  const ids = new Set<string>();
  const paths = new Set<string>();
  for (const moment of moments) {
    if (ids.has(moment.id)) {
      throw new Error(`moment id duplicado: ${moment.id}`);
    }
    ids.add(moment.id);
    if (paths.has(moment.local_path)) {
      throw new Error(`local_path duplicado: ${moment.local_path}`);
    }
    paths.add(moment.local_path);
  }

  return { version: 1, moments };
}

export function loadWorldCupMomentsCatalog(path = DEFAULT_MOMENTS_PATH): WorldCupMomentsCatalog {
  const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
  return parseWorldCupMomentsCatalog(raw);
}

export function momentImageExists(moment: WorldCupMoment, publicDir = PUBLIC_DIR): boolean {
  const relative = moment.local_path.replace(/^\//, "");
  return existsSync(resolve(publicDir, relative));
}

export function resolveMomentImageUrl(
  moment: WorldCupMoment,
  publicDir = PUBLIC_DIR
): string | null {
  if (!momentImageExists(moment, publicDir)) return null;
  return moment.local_path;
}

export function syncMomentStatuses(
  catalog: WorldCupMomentsCatalog,
  publicDir = PUBLIC_DIR
): WorldCupMomentsCatalog {
  return {
    version: 1,
    moments: catalog.moments.map((moment) => ({
      ...moment,
      status: momentImageExists(moment, publicDir) ? "ready" : "pending",
    })),
  };
}

export function filterReadyMoments(moments: WorldCupMoment[], publicDir = PUBLIC_DIR): WorldCupMoment[] {
  return moments.filter((moment) => momentImageExists(moment, publicDir));
}

export function pickMomentById(
  catalog: WorldCupMomentsCatalog,
  momentId: string,
  opts?: { readyOnly?: boolean; publicDir?: string }
): WorldCupMoment | null {
  const publicDir = opts?.publicDir ?? PUBLIC_DIR;
  const moment = catalog.moments.find((item) => item.id === momentId) ?? null;
  if (!moment) return null;
  if (opts?.readyOnly && !momentImageExists(moment, publicDir)) return null;
  return moment;
}

export function pickDefaultGuessImageMoment(
  catalog: WorldCupMomentsCatalog,
  seed = 0,
  publicDir = PUBLIC_DIR
): WorldCupMoment | null {
  const ready = filterReadyMoments(catalog.moments, publicDir);
  if (!ready.length) return null;
  const index = Math.abs(seed) % ready.length;
  return ready[index] ?? null;
}
