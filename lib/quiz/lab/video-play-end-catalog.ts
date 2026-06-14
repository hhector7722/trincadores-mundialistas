import { momentToVideoPlayEndQuestion } from "@/lib/quiz/lab/from-video-moment";
import type { LabQuestionVideoPlayEnd } from "@/lib/quiz/lab/types";
import { getWorldCupVideoMomentsCatalog } from "@/lib/quiz/world-cup-video-moments-catalog";
import {
  filterCatalogReadyVideoMoments,
  filterVideoMomentsByDifficulty,
  pickVideoPlayEndMoment,
  type WorldCupVideoMomentDifficulty,
} from "@/lib/quiz/world-cup-video-moments";

export type VideoPlayEndCatalogOptions = {
  seed?: number;
  minDifficulty?: WorldCupVideoMomentDifficulty;
  questionId?: string;
  excludeMomentIds?: string[];
};

export function createVideoPlayEndFromCatalog(
  opts?: VideoPlayEndCatalogOptions
): LabQuestionVideoPlayEnd | null {
  try {
    const catalog = getWorldCupVideoMomentsCatalog();
    const moment = pickVideoPlayEndMoment(catalog, {
      seed: opts?.seed ?? Date.now(),
      minDifficulty: opts?.minDifficulty ?? "medium",
      excludeIds: opts?.excludeMomentIds,
    });
    return moment ? momentToVideoPlayEndQuestion(moment, opts?.questionId) : null;
  } catch {
    return null;
  }
}

export function reloadVideoPlayEndFromCatalog(
  question: LabQuestionVideoPlayEnd,
  minDifficulty: WorldCupVideoMomentDifficulty = "medium"
): LabQuestionVideoPlayEnd {
  const exclude = question.momentId ? [question.momentId] : undefined;
  let fresh = createVideoPlayEndFromCatalog({
    minDifficulty,
    questionId: question.id,
    excludeMomentIds: exclude,
    seed: Date.now(),
  });
  if (!fresh) {
    fresh = createVideoPlayEndFromCatalog({
      minDifficulty,
      questionId: question.id,
      seed: Date.now() + 1,
    });
  }
  return fresh ?? question;
}

export function countReadyVideoMoments(minDifficulty: WorldCupVideoMomentDifficulty = "medium") {
  const catalog = getWorldCupVideoMomentsCatalog();
  let ready = filterCatalogReadyVideoMoments(catalog.moments);
  ready = filterVideoMomentsByDifficulty(ready, minDifficulty);
  return ready.length;
}
