import {
  filterCatalogReadyMoments,
  filterMomentsByDifficulty,
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
  minDifficulty?: WorldCupMomentDifficulty;
  answerTypes?: WorldCupMoment["quiz"]["answer_type"][];
  preferMultiplePlayers?: boolean;
  labSuitability?: LabSuitability;
};

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

  const contextual = ready.filter((moment) => moment.quiz.answer_type !== "player");
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
  const catalog = getWorldCupMomentsCatalog();
  const seed = opts?.seed ?? Math.floor(Math.random() * 1_000_000);
  const exclude = new Set(opts?.excludeIds ?? []);

  let ready = filterCatalogReadyMoments(catalog.moments).filter(
    (moment) =>
      moment.quiz.answer_type === "player" &&
      SILHOUETTE_LAB_MOMENT_ID_SET.has(moment.id) &&
      momentSupportsLabFormat(moment, "silhouette") &&
      isSilhouetteLabReadyMoment(moment.id)
  );

  // Pool curado a mano: no filtrar por dificultad (todos son easy; Medium/Hard vaciaría el pool).

  if (exclude.size) {
    ready = ready.filter((moment) => !exclude.has(moment.id));
  }

  if (!ready.length) return null;

  ready.sort((a, b) => a.id.localeCompare(b.id));
  return ready[Math.abs(seed) % ready.length] ?? null;
}
