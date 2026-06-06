"use client";

import { QuizImage } from "@/components/quiz/QuizImage";
import { QuizOptionButton } from "@/components/quiz/QuizOptionButton";
import {
  resolveOptionVisualState,
  type QuestionPhase,
} from "@/lib/quiz/play-flow";
import type { QuizQuestionPlay } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

type QuizQuestionStageProps = {
  question: QuizQuestionPlay;
  selectedOptionId: string | null;
  phase: QuestionPhase;
  secondsLeft: number;
  locked: boolean;
  onSelect: (optionId: string) => void;
};

export function QuizQuestionStage({
  question,
  selectedOptionId,
  phase,
  secondsLeft,
  locked,
  onSelect,
}: QuizQuestionStageProps) {
  const timerUrgent = secondsLeft <= 5 && phase === "answering";

  return (
    <div className="tm-quiz-stage flex flex-col gap-4">
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl border px-4 py-3",
          timerUrgent
            ? "border-red-500/60 bg-red-600"
            : "border-[var(--tm-border)] bg-[var(--tm-surface)]"
        )}
        aria-live="polite"
        aria-label={`Tiempo restante: ${secondsLeft} segundos`}
      >
        <span
          className={cn(
            "font-display text-3xl tabular-nums tracking-wide",
            timerUrgent ? "text-white" : "text-[var(--tm-accent)]"
          )}
        >
          {secondsLeft}
        </span>
      </div>

      <QuizImage src={question.image_url} alt="" />

      <p className="font-display text-lg leading-snug text-[var(--tm-fg)]">
        {question.prompt}
      </p>

      <div className="grid gap-2">
        {question.options.map((option) => (
          <QuizOptionButton
            key={option.id}
            optionId={option.id}
            label={option.label}
            visualState={resolveOptionVisualState({
              optionId: option.id,
              selectedOptionId,
              correctOptionId: question.correct_option_id,
              phase,
            })}
            locked={locked}
            onSelect={() => onSelect(option.id)}
          />
        ))}
      </div>
    </div>
  );
}
