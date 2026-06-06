"use client";

import { QuizImage } from "@/components/quiz/QuizImage";
import { QuizOptionButton } from "@/components/quiz/QuizOptionButton";
import { QuizProgressDots } from "@/components/quiz/QuizProgressDots";
import type { QuizQuestionPublic } from "@/lib/quiz/types";

type QuizQuestionStageProps = {
  question: QuizQuestionPublic;
  questionIndex: number;
  totalQuestions: number;
  selectedOptionId: string | null;
  locked: boolean;
  onSelect: (optionId: string) => void;
};

export function QuizQuestionStage({
  question,
  questionIndex,
  totalQuestions,
  selectedOptionId,
  locked,
  onSelect,
}: QuizQuestionStageProps) {
  return (
    <div className="tm-quiz-stage flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--tm-muted)]">
          Pregunta {questionIndex + 1} de {totalQuestions}
        </p>
        <QuizProgressDots total={totalQuestions} current={questionIndex + 1} />
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
            selected={selectedOptionId === option.id}
            locked={locked}
            onSelect={() => onSelect(option.id)}
          />
        ))}
      </div>
    </div>
  );
}
