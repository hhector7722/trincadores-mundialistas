import type { LabQuestionVideoPlayEnd } from "@/lib/quiz/lab/types";
import type { WorldCupVideoMoment } from "@/lib/quiz/world-cup-video-moments";
import { resolveVideoMomentUrl } from "@/lib/quiz/world-cup-video-moments";

export function momentToVideoPlayEndQuestion(
  moment: WorldCupVideoMoment,
  questionId?: string
): LabQuestionVideoPlayEnd | null {
  const videoUrl = resolveVideoMomentUrl(moment);
  if (!videoUrl) return null;

  const correctIndex = moment.quiz.options.findIndex(
    (option) => option === moment.quiz.correct_option
  );

  return {
    id: questionId ?? `video_${moment.id}`,
    format: "video_play_end",
    prompt: moment.quiz.prompt,
    videoUrl,
    stopAtSeconds: moment.stop_at_seconds,
    timerSeconds: 10,
    momentId: moment.id,
    momentLabel: moment.label,
    options: moment.quiz.options.map((label, index) => ({
      id: `opt_${index + 1}`,
      label,
    })),
    correctOptionId: `opt_${correctIndex >= 0 ? correctIndex + 1 : 1}`,
  };
}
