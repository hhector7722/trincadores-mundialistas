import {
  WORLD_CUP_MOMENTS_MIN_YEAR,
  WORLD_CUP_MOMENT_TYPES,
  type WorldCupMomentDifficulty,
  type WorldCupMomentStatus,
  type WorldCupMomentType,
} from "@/lib/quiz/world-cup-moments";

export const WORLD_CUP_VIDEO_MOMENTS_PUBLIC_PREFIX = "/videos/quiz/historic/";

export type WorldCupVideoMomentQuiz = {
  prompt: string;
  correct_option: string;
  options: [string, string, string, string];
};

export type WorldCupVideoMoment = {
  id: string;
  year: number;
  label: string;
  moment_type: WorldCupMomentType;
  teams: string[];
  players: string[];
  competition: string;
  difficulty: WorldCupMomentDifficulty;
  search_hint: string | null;
  /** Segundo del clip local donde se congela el vídeo en el quiz. */
  stop_at_seconds: number;
  /** Metadatos de importación (yt-dlp / ffmpeg). */
  clip_start_seconds: number | null;
  clip_duration_seconds: number | null;
  local_path: string;
  source_url: string | null;
  source_label: string;
  status: WorldCupMomentStatus;
  quiz: WorldCupVideoMomentQuiz;
};

export type WorldCupVideoMomentsCatalog = {
  version: 1;
  moments: WorldCupVideoMoment[];
};

const MOMENT_TYPES = new Set<WorldCupMomentType>(WORLD_CUP_MOMENT_TYPES);
const STATUSES = new Set<WorldCupMomentStatus>(["pending", "ready"]);
const DIFFICULTIES = new Set<WorldCupMomentDifficulty>(["easy", "medium", "hard"]);

const DIFFICULTY_RANK: Record<WorldCupMomentDifficulty, number> = {
  hard: 0,
  medium: 1,
  easy: 2,
};

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

function readVideoLocalPath(value: unknown, index: number): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`moments[${index}].local_path vacio.`);
  }
  const path = value.trim();
  if (!path.startsWith(WORLD_CUP_VIDEO_MOMENTS_PUBLIC_PREFIX)) {
    throw new Error(
      `moments[${index}].local_path debe empezar por ${WORLD_CUP_VIDEO_MOMENTS_PUBLIC_PREFIX}`
    );
  }
  if (!/\.(mp4|webm)$/i.test(path)) {
    throw new Error(`moments[${index}].local_path debe terminar en .mp4 o .webm.`);
  }
  return path;
}

function validateVideoQuiz(raw: unknown, index: number): WorldCupVideoMomentQuiz {
  if (!raw || typeof raw !== "object") {
    throw new Error(`moments[${index}].quiz invalido.`);
  }
  const row = raw as Record<string, unknown>;
  const prompt = readString(row, "prompt", index);
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

  return { prompt, correct_option: correctOption, options };
}

function readOptionalSeconds(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && value >= 0) return value;
  return null;
}

export function validateWorldCupVideoMoment(raw: unknown, index: number): WorldCupVideoMoment {
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

  const difficultyRaw = row.difficulty;
  const difficulty =
    typeof difficultyRaw === "string" && DIFFICULTIES.has(difficultyRaw as WorldCupMomentDifficulty)
      ? (difficultyRaw as WorldCupMomentDifficulty)
      : "medium";

  const searchHintRaw = row.search_hint;
  const searchHint =
    searchHintRaw === null || searchHintRaw === undefined
      ? null
      : typeof searchHintRaw === "string" && searchHintRaw.trim()
        ? searchHintRaw.trim()
        : null;

  const stopAt =
    typeof row.stop_at_seconds === "number" && row.stop_at_seconds > 0
      ? row.stop_at_seconds
      : 3;

  return {
    id,
    year,
    label: readString(row, "label", index),
    moment_type: momentType as WorldCupMomentType,
    teams: readStringArray(row, "teams", index),
    players: readStringArray(row, "players", index),
    competition: readString(row, "competition", index),
    difficulty,
    search_hint: searchHint,
    stop_at_seconds: stopAt,
    clip_start_seconds: readOptionalSeconds(row.clip_start_seconds),
    clip_duration_seconds: readOptionalSeconds(row.clip_duration_seconds),
    local_path: readVideoLocalPath(row.local_path, index),
    source_url: sourceUrl,
    source_label: readString(row, "source_label", index),
    status: status as WorldCupMomentStatus,
    quiz: validateVideoQuiz(row.quiz, index),
  };
}

export function parseWorldCupVideoMomentsCatalog(raw: unknown): WorldCupVideoMomentsCatalog {
  if (!raw || typeof raw !== "object") {
    throw new Error("El catalogo de videos debe ser un objeto.");
  }
  const root = raw as Record<string, unknown>;
  if (root.version !== 1) {
    throw new Error("world-cup-video-moments.json: version debe ser 1.");
  }
  if (!Array.isArray(root.moments)) {
    throw new Error("world-cup-video-moments.json: moments debe ser un array.");
  }

  const moments = root.moments.map((item, index) => validateWorldCupVideoMoment(item, index));
  const ids = new Set<string>();
  const paths = new Set<string>();
  for (const moment of moments) {
    if (ids.has(moment.id)) throw new Error(`moment id duplicado: ${moment.id}`);
    ids.add(moment.id);
    if (paths.has(moment.local_path)) throw new Error(`local_path duplicado: ${moment.local_path}`);
    paths.add(moment.local_path);
  }

  return { version: 1, moments };
}

export function filterCatalogReadyVideoMoments(moments: WorldCupVideoMoment[]): WorldCupVideoMoment[] {
  return moments.filter((moment) => moment.status === "ready");
}

export function filterVideoMomentsByDifficulty(
  moments: WorldCupVideoMoment[],
  minDifficulty: WorldCupMomentDifficulty
): WorldCupVideoMoment[] {
  const minRank = DIFFICULTY_RANK[minDifficulty];
  return moments.filter((moment) => DIFFICULTY_RANK[moment.difficulty] <= minRank);
}

export function resolveVideoMomentUrl(moment: WorldCupVideoMoment): string | null {
  return moment.status === "ready" ? moment.local_path : null;
}

export function pickVideoPlayEndMoment(
  catalog: WorldCupVideoMomentsCatalog,
  opts?: {
    seed?: number;
    minDifficulty?: WorldCupMomentDifficulty;
    excludeIds?: string[];
  }
): WorldCupVideoMoment | null {
  const seed = opts?.seed ?? Math.floor(Math.random() * 1_000_000);
  const minDifficulty = opts?.minDifficulty ?? "medium";
  const exclude = new Set(opts?.excludeIds ?? []);

  let ready = filterCatalogReadyVideoMoments(catalog.moments);
  ready = filterVideoMomentsByDifficulty(ready, minDifficulty);
  if (exclude.size) {
    ready = ready.filter((moment) => !exclude.has(moment.id));
  }

  if (!ready.length && minDifficulty !== "easy") {
    let fallback = filterVideoMomentsByDifficulty(
      filterCatalogReadyVideoMoments(catalog.moments),
      minDifficulty === "hard" ? "medium" : "easy"
    );
    if (exclude.size) {
      fallback = fallback.filter((moment) => !exclude.has(moment.id));
    }
    ready = fallback;
  }

  if (!ready.length) return null;

  ready.sort(
    (a, b) =>
      DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty] || a.id.localeCompare(b.id)
  );

  return ready[Math.abs(seed) % ready.length] ?? null;
}

export function pickVideoMomentById(
  catalog: WorldCupVideoMomentsCatalog,
  momentId: string,
  opts?: { readyOnly?: boolean }
): WorldCupVideoMoment | null {
  const moment = catalog.moments.find((item) => item.id === momentId) ?? null;
  if (!moment) return null;
  if (opts?.readyOnly && moment.status !== "ready") return null;
  return moment;
}
