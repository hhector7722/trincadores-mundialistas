import {
  filterCatalogReadyMoments,
  filterMomentsByDifficulty,
  pickGuessImageMoment,
  type WorldCupMoment,
  type WorldCupMomentDifficulty,
} from "@/lib/quiz/world-cup-moments";
import { getWorldCupMomentsCatalog } from "@/lib/quiz/world-cup-moments-catalog";

export type PickMomentOptions = {
  seed?: number;
  excludeIds?: string[];
  minDifficulty?: WorldCupMomentDifficulty;
  answerTypes?: WorldCupMoment["quiz"]["answer_type"][];
  preferMultiplePlayers?: boolean;
};

function momentPlayerCount(moment: WorldCupMoment): number {
  return moment.players.length;
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

  if (opts?.preferMultiplePlayers) {
    const multi = ready.filter((moment) => momentPlayerCount(moment) >= 1);
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

export function pickPlayerMoment(opts?: PickMomentOptions): WorldCupMoment | null {
  return pickCatalogMoment({
    ...opts,
    answerTypes: ["player"],
  });
}

export function pickSilhouetteSourceMoment(opts?: PickMomentOptions): WorldCupMoment | null {
  return (
    pickCatalogMoment({
      ...opts,
      preferMultiplePlayers: true,
      answerTypes: ["player"],
    }) ??
    pickCatalogMoment({
      ...opts,
      answerTypes: ["player"],
    })
  );
}
