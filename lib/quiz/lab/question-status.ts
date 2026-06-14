import {
  canAutoGenerateLabFormat,
  questionNeedsAutoGeneration,
} from "@/lib/quiz/lab/auto-formats";
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
    return !question.momentId;
  }

  if (question.format === "multiple_choice") {
    return question.options.every((option) => option.label === PLACEHOLDER_OPTION);
  }

  return false;
}

export function labQuestionIsReady(question: LabQuestion): boolean {
  return !labQuestionNeedsGeneration(question);
}
