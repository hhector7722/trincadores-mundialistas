"use client";

import { QuizImage } from "@/components/quiz/QuizImage";
import { QuizOptionButton } from "@/components/quiz/QuizOptionButton";
import { QuizProgressDots } from "@/components/quiz/QuizProgressDots";
import {
  QUESTION_TIME_SEC,
  resolveOptionVisualState,
  type QuestionPhase,
} from "@/lib/quiz/play-flow";
import type { QuizQuestionPlay } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

type QuizQuestionStageProps = {
  question: QuizQuestionPlay;
  questionIndex: number;
  totalQuestions: number;
  selectedOptionId: string | null;
  phase: QuestionPhase;
  secondsLeft: number;
  locked: boolean;
  onSelect: (optionId: string) => void;
};

export function QuizQuestionStage({
  question,
  questionIndex,
  totalQuestions,
  selectedOptionId,
  phase,
  secondsLeft,
  locked,
  onSelect,
}: QuizQuestionStageProps) {
  const timerUrgent = secondsLeft <= 3 && phase === "answering";

  return (
    <div className="tm-quiz-stage flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--tm-muted)]">
          Pregunta {questionIndex + 1} de {totalQuestions}
        </p>
        <QuizProgressDots total={totalQuestions} current={questionIndex + 1} />
      </div>

      <div
        className={cn(
          "flex items-center justify-center gap-2 rounded-2xl border px-4 py-3",
          timerUrgent
            ? "border-red-400/40 bg-red-500/10"
            : "border-[var(--tm-border)] bg-[var(--tm-surface)]"
        )}
        aria-live="polite"
        aria-label={`Tiempo restante: ${secondsLeft} segundos`}
      >
        <span
          className={cn(
            "font-display text-3xl tabular-nums tracking-wide",
            timerUrgent ? "text-red-300" : "text-[var(--tm-accent)]"
          )}
        >
          {secondsLeft}
        </span>
        <span className="text-xs uppercase tracking-[0.14em] text-[var(--tm-muted)]">
          seg
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

export { QUESTION_TIME_SEC };
