"use client";

import { QuizImage } from "@/components/quiz/QuizImage";
import { QuizOptionButton } from "@/components/quiz/QuizOptionButton";
import {
  resolveOptionVisualState,
  type QuestionPhase,
} from "@/lib/quiz/play-flow";
import type { QuizQuestionPlay } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

type QuizSilhouetteQuestionStageProps = {
  question: QuizQuestionPlay;
  selectedOptionId: string | null;
  phase: QuestionPhase;
  secondsLeft: number;
  locked: boolean;
  onSelect: (optionId: string) => void;
};

export function QuizSilhouetteQuestionStage({
  question,
  selectedOptionId,
  phase,
  secondsLeft,
  locked,
  onSelect,
}: QuizSilhouetteQuestionStageProps) {
  const timerUrgent = secondsLeft <= 5 && phase === "answering";
  const revealed = phase === "feedback";
  const revealSrc = revealed ? question.reveal_image_url ?? question.image_url : question.image_url;
  const correctName =
    question.options.find((option) => option.id === question.correct_option_id)?.label ?? null;

  return (
    <div className="tm-quiz-stage flex flex-col gap-4">
      <div
        className={cn(
          "tm-quiz-timer flex items-center justify-center rounded-2xl px-4 py-3",
          timerUrgent && "tm-quiz-timer--urgent"
        )}
        aria-live="polite"
        aria-label={`Tiempo restante: ${secondsLeft} segundos`}
      >
        <span className="tm-quiz-timer-value font-display text-3xl tabular-nums tracking-wide">
          {secondsLeft}
        </span>
      </div>

      <div className="relative">
        <QuizImage src={revealSrc} alt="" />
        {!revealed ? (
          <div className="pointer-events-none absolute inset-x-0 top-3 text-center">
            <span className="rounded-lg bg-black/70 px-3 py-1 font-display text-xs uppercase tracking-widest text-white">
              {question.prompt}
            </span>
          </div>
        ) : correctName ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-black via-black/90 to-transparent px-4 pb-4 pt-12">
            <p className="text-center font-display text-2xl uppercase tracking-wide text-white">
              {correctName}
            </p>
          </div>
        ) : null}
      </div>

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
