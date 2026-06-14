"use client";

import { useQuizEntry } from "@/components/quiz/QuizEntryProvider";

export function QuizReplayButton() {
  const { requestQuizEntry } = useQuizEntry();

  return (
    <button
      type="button"
      onClick={requestQuizEntry}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--tm-accent)] px-5 text-sm font-semibold text-[var(--tm-primary-fg)]"
    >
      Jugar otra vez
    </button>
  );
}
