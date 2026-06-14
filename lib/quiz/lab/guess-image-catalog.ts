import { momentToGuessImageQuestion } from "@/lib/quiz/lab/from-moment";
import type { LabQuestionGuessImage } from "@/lib/quiz/lab/types";
import { getWorldCupMomentsCatalog } from "@/lib/quiz/world-cup-moments-catalog";
import {
  pickGuessImageMoment,
  type WorldCupMomentDifficulty,
} from "@/lib/quiz/world-cup-moments";

export type GuessImageCatalogOptions = {
  seed?: number;
  minDifficulty?: WorldCupMomentDifficulty;
  questionId?: string;
  excludeMomentIds?: string[];
};

export function createGuessImageFromCatalog(
  opts?: GuessImageCatalogOptions
): LabQuestionGuessImage | null {
  try {
    const catalog = getWorldCupMomentsCatalog();
    const moment = pickGuessImageMoment(catalog, {
      seed: opts?.seed,
      minDifficulty: opts?.minDifficulty ?? "hard",
      excludeIds: opts?.excludeMomentIds,
    });
    return moment ? momentToGuessImageQuestion(moment, opts?.questionId) : null;
  } catch {
    return null;
  }
}

export function reloadGuessImageFromCatalog(
  question: LabQuestionGuessImage,
  minDifficulty: WorldCupMomentDifficulty = "hard"
): LabQuestionGuessImage {
  const exclude = question.momentId ? [question.momentId] : undefined;
  let fresh = createGuessImageFromCatalog({
    minDifficulty,
    questionId: question.id,
    excludeMomentIds: exclude,
    seed: Date.now(),
  });
  if (!fresh) {
    fresh = createGuessImageFromCatalog({
      minDifficulty,
      questionId: question.id,
      seed: Date.now() + 1,
    });
  }
  return fresh ?? question;
}
