import {
  canAutoGenerateLabFormat,
  questionNeedsAutoGeneration,
} from "@/lib/quiz/lab/auto-formats";
import { isStaticLabGeneratedAssetUrl } from "@/lib/quiz/lab/lab-asset-url";
import { canReloadLabQuestion } from "@/lib/quiz/lab/reload-question";
import type { LabQuestion, LabQuestionFormat } from "@/lib/quiz/lab/types";

const PLACEHOLDER_OPTION = "—";

export function canGenerateLabQuestion(format: LabQuestionFormat): boolean {
  return canAutoGenerateLabFormat(format) || canReloadLabQuestion(format);
}

export function labQuestionNeedsGeneration(question: LabQuestion): boolean {
  if (canAutoGenerateLabFormat(question.format)) {
    return questionNeedsAutoGeneration(question);
  }

  if (question.format === "guess_selection") {
    return !question.selectionPresetId || question.slots.length === 0;
  }

  if (question.format === "video_play_end") {
    const videoUrl = question.videoUrl?.trim() ?? "";
    const hasHistoricClip =
      videoUrl.startsWith("/videos/quiz/historic/") &&
      !videoUrl.includes("/demo/") &&
      !videoUrl.includes("gabri-video");
    return !question.momentId || !hasHistoricClip;
  }

  if (
    question.format === "guess_player_hair" ||
    question.format === "guess_player_eyes" ||
    question.format === "guess_player_silhouette"
  ) {
    const imageUrl = question.imageUrl?.trim() ?? "";
    return !question.momentId || !isStaticLabGeneratedAssetUrl(imageUrl);
  }

  if (question.format === "multiple_choice") {
    return question.options.every((option) => option.label === PLACEHOLDER_OPTION);
  }

  return false;
}

export function labQuestionIsReady(question: LabQuestion): boolean {
  return !labQuestionNeedsGeneration(question);
}
