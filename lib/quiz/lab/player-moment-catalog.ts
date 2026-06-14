import {
  momentToPlayerCropQuestion,
  momentToSilhouetteQuestion,
} from "@/lib/quiz/lab/from-player-moment";
import { pickPlayerMoment, pickSilhouetteSourceMoment } from "@/lib/quiz/lab/moment-picker";
import type {
  LabQuestionGuessPlayerCrop,
  LabQuestionGuessPlayerSilhouette,
} from "@/lib/quiz/lab/types";
import type { WorldCupMomentDifficulty } from "@/lib/quiz/world-cup-moments";

export type PlayerMomentCatalogOptions = {
  seed?: number;
  minDifficulty?: WorldCupMomentDifficulty;
  questionId?: string;
  excludeMomentIds?: string[];
};

export function createPlayerCropFromCatalog(
  format: "guess_player_hair" | "guess_player_eyes",
  opts?: PlayerMomentCatalogOptions
): LabQuestionGuessPlayerCrop | null {
  const moment = pickPlayerMoment({
    seed: opts?.seed ?? Date.now(),
    excludeIds: opts?.excludeMomentIds,
    minDifficulty: opts?.minDifficulty ?? "medium",
  });
  if (!moment) return null;
  return momentToPlayerCropQuestion(moment, format, opts?.questionId ?? crypto.randomUUID());
}

export function reloadPlayerCropFromCatalog(
  question: LabQuestionGuessPlayerCrop,
  minDifficulty: WorldCupMomentDifficulty = "medium"
): LabQuestionGuessPlayerCrop | null {
  const exclude = question.momentId ? [question.momentId] : undefined;
  let fresh = createPlayerCropFromCatalog(question.format, {
    minDifficulty,
    questionId: question.id,
    excludeMomentIds: exclude,
    seed: Date.now(),
  });
  if (!fresh) {
    fresh = createPlayerCropFromCatalog(question.format, {
      minDifficulty,
      questionId: question.id,
      seed: Date.now() + 1,
    });
  }
  return fresh;
}

export function createSilhouetteFromCatalog(
  opts?: PlayerMomentCatalogOptions
): LabQuestionGuessPlayerSilhouette | null {
  const moment = pickSilhouetteSourceMoment({
    seed: opts?.seed ?? Date.now(),
    excludeIds: opts?.excludeMomentIds,
    minDifficulty: opts?.minDifficulty ?? "medium",
  });
  if (!moment) return null;
  return momentToSilhouetteQuestion(moment, opts?.questionId ?? crypto.randomUUID());
}

export function reloadSilhouetteFromCatalog(
  question: LabQuestionGuessPlayerSilhouette,
  minDifficulty: WorldCupMomentDifficulty = "medium"
): LabQuestionGuessPlayerSilhouette | null {
  const exclude = question.momentId ? [question.momentId] : undefined;
  let fresh = createSilhouetteFromCatalog({
    minDifficulty,
    questionId: question.id,
    excludeMomentIds: exclude,
    seed: Date.now(),
  });
  if (!fresh) {
    fresh = createSilhouetteFromCatalog({
      minDifficulty,
      questionId: question.id,
      seed: Date.now() + 1,
    });
  }
  return fresh;
}
