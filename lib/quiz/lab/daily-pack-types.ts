import type { LabQuestion } from "@/lib/quiz/lab/types";

export type QuizLabDailyPack = {
  quizDate: string;
  generatedAt: string;
  momentIds: string[];
  questions: LabQuestion[];
};

export type PregenerateQuizLabDailyPackResult = {
  quizDate: string;
  skipped: boolean;
  pack: QuizLabDailyPack | null;
};

export function labDailyPackSettingsSummary(pack: QuizLabDailyPack) {
  return {
    quiz_date: pack.quizDate,
    generated_at: pack.generatedAt,
    moment_ids: pack.momentIds,
    question_count: pack.questions.length,
    formats: pack.questions.map((q) => q.format),
  };
}
