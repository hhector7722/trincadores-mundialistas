import {
  canAutoGenerateLabFormat,
} from "@/lib/quiz/lab/auto-formats";
import { fetchGeneratedLabQuestion } from "@/lib/quiz/lab/generate-question.client";
import { reloadLabQuestion } from "@/lib/quiz/lab/reload-question";
import type { LabQuestion } from "@/lib/quiz/lab/types";
import type { WorldCupMomentDifficulty } from "@/lib/quiz/world-cup-moments";

export type GenerateLabQuestionContentOptions = {
  minDifficulty?: WorldCupMomentDifficulty;
  force?: boolean;
};

export async function generateLabQuestionContent(
  question: LabQuestion,
  options?: GenerateLabQuestionContentOptions
): Promise<LabQuestion> {
  const minDifficulty = options?.minDifficulty ?? "medium";
  const force = options?.force ?? false;

  if (canAutoGenerateLabFormat(question.format)) {
    return fetchGeneratedLabQuestion({
      format: question.format,
      questionId: question.id,
      excludeMomentId:
        "momentId" in question && question.momentId ? question.momentId : null,
      minDifficulty,
      force,
    });
  }

  return reloadLabQuestion(question, { minDifficulty });
}
