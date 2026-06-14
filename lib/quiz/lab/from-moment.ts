import type { LabQuestionGuessImage } from "@/lib/quiz/lab/types";
import type { WorldCupMoment } from "@/lib/quiz/world-cup-moments";
import { resolveMomentImageUrl } from "@/lib/quiz/world-cup-moments";

export function momentToGuessImageQuestion(
  moment: WorldCupMoment,
  questionId?: string
): LabQuestionGuessImage | null {
  const imageUrl = resolveMomentImageUrl(moment);
  if (!imageUrl) return null;

  const correctIndex = moment.quiz.options.findIndex(
    (option) => option === moment.quiz.correct_option
  );
  const correctOptionId = `opt_${correctIndex >= 0 ? correctIndex + 1 : 1}`;

  return {
    id: questionId ?? `moment_${moment.id}`,
    format: "guess_image",
    prompt: moment.quiz.prompt,
    imageUrl,
    blurStartPx: moment.quiz.blur_start_px,
    revealSeconds: moment.quiz.reveal_seconds,
    timerSeconds: 10,
    options: moment.quiz.options.map((label, index) => ({
      id: `opt_${index + 1}`,
      label,
    })),
    correctOptionId,
  };
}
