import type { QuizOption } from "@/lib/quiz/types";

export const QUESTION_TIME_SEC = 10;
export const FEEDBACK_DELAY_MS = 1000;

export type QuestionPhase = "answering" | "feedback";

export type OptionVisualState = "default" | "correct" | "wrong" | "revealed";

export function pickWrongOptionId(
  options: QuizOption[],
  correctOptionId: string
): string {
  const wrong = options.find((o) => o.id !== correctOptionId);
  return wrong?.id ?? options[0]?.id ?? "a";
}

export function resolveOptionVisualState(args: {
  optionId: string;
  selectedOptionId: string | null;
  correctOptionId: string;
  phase: QuestionPhase;
}): OptionVisualState {
  const { optionId, selectedOptionId, correctOptionId, phase } = args;
  if (phase === "answering") return "default";

  const isCorrect = optionId === correctOptionId;
  const isSelected = optionId === selectedOptionId;

  if (isSelected && isCorrect) return "correct";
  if (isSelected && !isCorrect) return "wrong";
  if (!isSelected && isCorrect) return "revealed";
  return "default";
}

export function shouldAutoSubmit(step: number, totalQuestions: number): boolean {
  return step >= totalQuestions - 1;
}

export function nextStepAfterFeedback(step: number, totalQuestions: number): number | null {
  if (step >= totalQuestions - 1) return null;
  return step + 1;
}
