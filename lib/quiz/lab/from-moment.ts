import type { LabQuestionImageTrivia } from "@/lib/quiz/lab/types";
import type { WorldCupMoment } from "@/lib/quiz/world-cup-moments";
import { resolveMomentImageUrl } from "@/lib/quiz/world-cup-moments";

export function momentToImageTriviaQuestion(
  moment: WorldCupMoment,
  questionId?: string
): LabQuestionImageTrivia | null {
  const imageUrl = resolveMomentImageUrl(moment);
  if (!imageUrl) return null;

  const correctIndex = moment.quiz.options.findIndex(
    (option) => option === moment.quiz.correct_option
  );
  const correctOptionId = `opt_${correctIndex >= 0 ? correctIndex + 1 : 1}`;

  return {
    id: questionId ?? `moment_${moment.id}`,
    format: "image_trivia",
    prompt: moment.quiz.prompt,
    imageUrl,
    timerSeconds: 10,
    momentId: moment.id,
    momentLabel: moment.label,
    momentDifficulty: moment.difficulty,
    answerType: moment.quiz.answer_type,
    options: moment.quiz.options.map((label, index) => ({
      id: `opt_${index + 1}`,
      label,
    })),
    correctOptionId,
  };
}

/** @deprecated Usar momentToImageTriviaQuestion */
export const momentToGuessImageQuestion = momentToImageTriviaQuestion;
