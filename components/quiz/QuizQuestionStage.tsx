"use client";


import { QuizScoreGapStage } from "./QuizScoreGapStage";
import { QuizJerseyPickStage } from "./QuizJerseyPickStage";
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

export function QuizQuestionStage(props: QuizQuestionStageProps) {
  const { question, phase } = props;

  if (question.format === "score_gap") {
    return <QuizScoreGapStage {...props} />;
  }

  if (question.format === "jersey_pick") {
    return <QuizJerseyPickStage {...props} />;
  }



  return <QuizTriviaStage {...props} />;
}

function QuizTriviaStage({
  question,
  selectedOptionId,
  phase,
  secondsLeft,
  locked,
  onSelect,
}: QuizQuestionStageProps) {
  const timerUrgent = secondsLeft <= 5 && phase === "answering";
  const hasImage = Boolean(question.image_url?.trim());

  return (
    <div
      className={cn(
        "tm-quiz-stage flex flex-col gap-2",
        hasImage && "tm-quiz-stage--fit-viewport min-h-0 flex-1"
      )}
    >
      <div
        className={cn(
          "tm-quiz-timer shrink-0 flex items-center justify-center rounded-2xl px-4 py-2",
          hasImage && "tm-quiz-timer--compact",
          timerUrgent && "tm-quiz-timer--urgent"
        )}
        aria-live="polite"
        aria-label={`Tiempo restante: ${secondsLeft} segundos`}
      >
        <span
          className={cn(
            "tm-quiz-timer-value font-display tabular-nums tracking-wide",
            hasImage ? "text-2xl" : "text-3xl"
          )}
        >
          {secondsLeft}
        </span>
      </div>

      {hasImage ? (
        <div className="tm-quiz-stage__body flex min-h-0 flex-1 flex-col gap-2">
          <div className="tm-quiz-stage__media relative min-h-0 flex-1">
            <QuizImage src={question.image_url} alt="" fitContainer className="absolute inset-0" />
          </div>
          <p className="shrink-0 font-display text-base leading-snug text-[var(--tm-fg)] line-clamp-2">
            {question.prompt}
          </p>
        </div>
      ) : (
        <>
          <QuizImage src={question.image_url} alt="" />
          <p className="font-display text-lg leading-snug text-[var(--tm-fg)]">
            {question.prompt}
          </p>
        </>
      )}

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
