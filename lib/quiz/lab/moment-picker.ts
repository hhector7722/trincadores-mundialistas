import {
  filterCatalogReadyMoments,
  filterMomentsByDifficulty,
  isImageTriviaAnswerTypeAllowed,
  pickGuessImageMoment,
  type LabSuitability,
  type WorldCupMoment,
  type WorldCupMomentDifficulty,
} from "@/lib/quiz/world-cup-moments";
import { getWorldCupMomentsCatalog } from "@/lib/quiz/world-cup-moments-catalog";
import {
  isSilhouetteLabReadyMoment,
  SILHOUETTE_LAB_MOMENT_ID_SET,
} from "@/lib/quiz/lab/silhouette-lab-pool";

export type PickMomentOptions = {
  seed?: number;
  excludeIds?: string[];
  /** Jugadores ya usados en otra pregunta del mismo día (nombre normalizado). */
  excludePlayerKeys?: string[];
  minDifficulty?: WorldCupMomentDifficulty;
  answerTypes?: WorldCupMoment["quiz"]["answer_type"][];
  preferMultiplePlayers?: boolean;
  labSuitability?: LabSuitability;
};

export function normalizePlayerKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function momentUsesExcludedPlayer(
  moment: WorldCupMoment,
  excludePlayerKeys: Set<string>
): boolean {
  if (!excludePlayerKeys.size) return false;
  return moment.players.some((player) => excludePlayerKeys.has(normalizePlayerKey(player)));
}

function filterExcludedPlayers(
  moments: WorldCupMoment[],
  excludePlayerKeys?: string[]
): WorldCupMoment[] {
  if (!excludePlayerKeys?.length) return moments;
  const excluded = new Set(excludePlayerKeys);
  return moments.filter((moment) => !momentUsesExcludedPlayer(moment, excluded));
}

function momentSupportsLabFormat(moment: WorldCupMoment, format: LabSuitability): boolean {
  if (!moment.lab_suitability?.length) {
    return format === "silhouette";
  }
  return moment.lab_suitability.includes(format);
}

export function pickCatalogMoment(opts?: PickMomentOptions): WorldCupMoment | null {
  const catalog = getWorldCupMomentsCatalog();
  const seed = opts?.seed ?? Math.floor(Math.random() * 1_000_000);
  const exclude = new Set(opts?.excludeIds ?? []);
  const minDifficulty = opts?.minDifficulty ?? "medium";

  let ready = filterCatalogReadyMoments(catalog.moments);
  ready = filterMomentsByDifficulty(ready, minDifficulty);

  if (opts?.answerTypes?.length) {
    const filtered = ready.filter((moment) =>
      opts.answerTypes!.includes(moment.quiz.answer_type)
    );
    if (filtered.length) ready = filtered;
  }

  if (opts?.labSuitability) {
    const suitable = ready.filter((moment) =>
      momentSupportsLabFormat(moment, opts.labSuitability!)
    );
    if (suitable.length) ready = suitable;
  }

  if (opts?.preferMultiplePlayers) {
    const multi = ready.filter((moment) => moment.players.length >= 2);
    if (multi.length) ready = multi;
  }

  if (exclude.size) {
    ready = ready.filter((moment) => !exclude.has(moment.id));
  }

  ready = filterExcludedPlayers(ready, opts?.excludePlayerKeys);

  if (!ready.length) return null;

  ready.sort((a, b) => a.id.localeCompare(b.id));
  return ready[Math.abs(seed) % ready.length] ?? null;
}

export function pickImageTriviaMoment(opts?: PickMomentOptions): WorldCupMoment | null {
  const catalog = getWorldCupMomentsCatalog();
  const seed = opts?.seed ?? Math.floor(Math.random() * 1_000_000);
  const exclude = new Set(opts?.excludeIds ?? []);
  const minDifficulty = opts?.minDifficulty ?? "medium";

  let ready = filterCatalogReadyMoments(catalog.moments);
  ready = filterMomentsByDifficulty(ready, minDifficulty);
  if (exclude.size) {
    ready = ready.filter((moment) => !exclude.has(moment.id));
  }

  ready = filterExcludedPlayers(ready, opts?.excludePlayerKeys);

  const contextual = ready.filter((moment) =>
    isImageTriviaAnswerTypeAllowed(moment.quiz.answer_type)
  );
  const pool = contextual.length ? contextual : ready;
  if (!pool.length) return null;

  return pickGuessImageMoment(
    { version: 1, moments: pool },
    { seed, minDifficulty, excludeIds: [...exclude] }
  );
}

export function pickPlayerMoment(
  format: "guess_player_hair" | "guess_player_eyes",
  opts?: PickMomentOptions
): WorldCupMoment | null {
  return pickCatalogMoment({
    ...opts,
    answerTypes: ["player"],
    labSuitability: format === "guess_player_hair" ? "hair" : "eyes",
  });
}

export function pickSilhouetteSourceMoment(opts?: PickMomentOptions): WorldCupMoment | null {
  const seed = opts?.seed ?? Math.floor(Math.random() * 1_000_000);
  const exclude = new Set(opts?.excludeIds ?? []);

  let ready = filterCatalogReadyMoments(getWorldCupMomentsCatalog().moments).filter(
    (moment) =>
      moment.quiz.answer_type === "player" &&
      SILHOUETTE_LAB_MOMENT_ID_SET.has(moment.id) &&
      momentSupportsLabFormat(moment, "silhouette") &&
      isSilhouetteLabReadyMoment(moment.id)
  );

  if (exclude.size) {
    ready = ready.filter((moment) => !exclude.has(moment.id));
  }

  ready = filterExcludedPlayers(ready, opts?.excludePlayerKeys);

  if (!ready.length) return null;

  ready.sort((a, b) => a.id.localeCompare(b.id));
  return ready[Math.abs(seed) % ready.length] ?? null;
}
