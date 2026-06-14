import { momentToImageTriviaQuestion } from "@/lib/quiz/lab/from-moment";
import type { LabQuestionImageTrivia } from "@/lib/quiz/lab/types";
import { getWorldCupMomentsCatalog } from "@/lib/quiz/world-cup-moments-catalog";
import {
  filterCatalogReadyMoments,
  filterMomentsByDifficulty,
  type WorldCupMoment,
  type WorldCupMomentDifficulty,
} from "@/lib/quiz/world-cup-moments";

export type ImageTriviaCatalogOptions = {
  seed?: number;
  minDifficulty?: WorldCupMomentDifficulty;
  questionId?: string;
  excludeMomentIds?: string[];
};

function pickImageTriviaMoment(
  moments: WorldCupMoment[],
  seed: number
): WorldCupMoment | null {
  if (!moments.length) return null;

  const contextual = moments.filter((moment) => moment.quiz.answer_type !== "player");
  const pool = contextual.length ? contextual : moments;
  pool.sort((a, b) => a.id.localeCompare(b.id));
  return pool[Math.abs(seed) % pool.length] ?? null;
}

export function createImageTriviaFromCatalog(
  opts?: ImageTriviaCatalogOptions
): LabQuestionImageTrivia | null {
  try {
    const catalog = getWorldCupMomentsCatalog();
    const seed = opts?.seed ?? Math.floor(Math.random() * 1_000_000);
    const exclude = new Set(opts?.excludeMomentIds ?? []);

    let ready = filterCatalogReadyMoments(catalog.moments);
    ready = filterMomentsByDifficulty(ready, opts?.minDifficulty ?? "medium");
    if (exclude.size) {
      ready = ready.filter((moment) => !exclude.has(moment.id));
    }

    const moment = pickImageTriviaMoment(ready, seed);
    return moment ? momentToImageTriviaQuestion(moment, opts?.questionId) : null;
  } catch {
    return null;
  }
}

export function reloadImageTriviaFromCatalog(
  question: LabQuestionImageTrivia,
  minDifficulty: WorldCupMomentDifficulty = "medium"
): LabQuestionImageTrivia {
  const exclude = question.momentId ? [question.momentId] : undefined;
  let fresh = createImageTriviaFromCatalog({
    minDifficulty,
    questionId: question.id,
    excludeMomentIds: exclude,
    seed: Date.now(),
  });
  if (!fresh) {
    fresh = createImageTriviaFromCatalog({
      minDifficulty,
      questionId: question.id,
      seed: Date.now() + 1,
    });
  }
  return fresh ?? question;
}

