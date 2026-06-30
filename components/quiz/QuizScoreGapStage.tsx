"use client";

import { QuizOptionButton } from "@/components/quiz/QuizOptionButton";
import { resolveOptionVisualState, type QuestionPhase } from "@/lib/quiz/play-flow";
import type { QuizQuestionPlay } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

type QuizScoreGapStageProps = {
  question: QuizQuestionPlay;
  selectedOptionId: string | null;
  phase: QuestionPhase;
  secondsLeft: number;
  locked: boolean;
  onSelect: (optionId: string) => void;
};

export function QuizScoreGapStage({
  question,
  selectedOptionId,
  phase,
  secondsLeft,
  locked,
  onSelect,
}: QuizScoreGapStageProps) {
  const timerUrgent = secondsLeft <= 5 && phase === "answering";

  return (
    <div className="tm-quiz-stage flex flex-col gap-8 min-h-0 flex-1 justify-center py-6">
      <div className="flex justify-center">
        <div
          className={cn(
            "tm-quiz-timer shrink-0 flex items-center justify-center rounded-2xl px-6 py-3",
            timerUrgent && "tm-quiz-timer--urgent"
          )}
          aria-live="polite"
        >
          <span className="tm-quiz-timer-value font-display text-4xl tabular-nums tracking-wide">
            {secondsLeft}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center text-center px-4">
        <p className="font-display text-2xl font-bold leading-snug text-[var(--tm-fg)]">
          {question.prompt}
        </p>
      </div>

      <div className="tm-quiz-stage__options grid grid-cols-2 gap-4 shrink-0 px-4">
        {question.options.map((option) => (
          <QuizOptionButton
            key={option.id}
            compact
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
