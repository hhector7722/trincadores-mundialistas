import { canAutoGenerateLabFormat } from "@/lib/quiz/lab/auto-formats";
import { fetchGeneratedLabQuestion } from "@/lib/quiz/lab/generate-question.client";
import {
  createImageTriviaFromCatalog,
  reloadImageTriviaFromCatalog,
} from "@/lib/quiz/lab/image-trivia-catalog";
import { reloadLabQuestion } from "@/lib/quiz/lab/reload-question";
import type { LabQuestion, LabQuestionImageTrivia } from "@/lib/quiz/lab/types";
import type { WorldCupMomentDifficulty } from "@/lib/quiz/world-cup-moments";

export type GenerateLabQuestionContentOptions = {
  minDifficulty?: WorldCupMomentDifficulty;
  /** true = rotar a otro momento / otro contenido */
  force?: boolean;
};

function clientGeneratedFormats(question: LabQuestion): boolean {
  return (
    question.format === "multiple_choice" ||
    question.format === "guess_selection" ||
    question.format === "video_play_end" ||
    question.format === "image_trivia"
  );
}

export async function generateLabQuestionContent(
  question: LabQuestion,
  options?: GenerateLabQuestionContentOptions
): Promise<LabQuestion> {
  const minDifficulty = options?.minDifficulty ?? "medium";
  const force = options?.force ?? false;

  if (question.format === "image_trivia") {
    const exclude = question.momentId ? [question.momentId] : undefined;
    const fresh =
      force && question.momentId
        ? reloadImageTriviaFromCatalog(question as LabQuestionImageTrivia, minDifficulty)
        : createImageTriviaFromCatalog({
            minDifficulty,
            questionId: question.id,
            excludeMomentIds: exclude,
            seed: Date.now(),
          });

    if (!fresh) {
      throw new Error("No hay momentos listos en el catálogo para trivia de imagen.");
    }
    return fresh;
  }

  if (clientGeneratedFormats(question)) {
    return reloadLabQuestion(question, { minDifficulty });
  }

  if (!canAutoGenerateLabFormat(question.format)) {
    throw new Error("Formato no soportado para generación.");
  }

  const hasMoment = "momentId" in question && Boolean(question.momentId);
  const pregenerateAssets = force && hasMoment;

  return fetchGeneratedLabQuestion({
    format: question.format,
    questionId: question.id,
    excludeMomentId:
      "momentId" in question && question.momentId ? question.momentId : null,
    minDifficulty,
    force: pregenerateAssets,
  });
}
