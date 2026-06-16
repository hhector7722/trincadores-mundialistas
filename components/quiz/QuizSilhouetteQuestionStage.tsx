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
    <div className="tm-quiz-stage tm-quiz-stage--fit-viewport flex min-h-0 flex-1 flex-col gap-2">
      <div
        className={cn(
          "tm-quiz-timer tm-quiz-timer--compact shrink-0 flex items-center justify-center rounded-2xl px-4 py-2",
          timerUrgent && "tm-quiz-timer--urgent"
        )}
        aria-live="polite"
        aria-label={`Tiempo restante: ${secondsLeft} segundos`}
      >
        <span className="tm-quiz-timer-value font-display text-2xl tabular-nums tracking-wide">
          {secondsLeft}
        </span>
      </div>

      <div className="tm-quiz-stage__media relative min-h-0 flex-1">
        <QuizImage src={revealSrc} alt="" fitContainer className="absolute inset-0" />
        {!revealed ? (
          <div className="pointer-events-none absolute inset-x-0 top-2 text-center">
            <span className="rounded-lg bg-black/70 px-3 py-1 font-display text-xs uppercase tracking-widest text-white">
              {question.prompt}
            </span>
          </div>
        ) : correctName ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-black via-black/90 to-transparent px-4 pb-3 pt-10">
            <p className="text-center font-display text-xl uppercase tracking-wide text-white">
              {correctName}
            </p>
          </div>
        ) : null}
      </div>

      <div className="tm-quiz-stage__options tm-quiz-stage__options--grid shrink-0">
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
