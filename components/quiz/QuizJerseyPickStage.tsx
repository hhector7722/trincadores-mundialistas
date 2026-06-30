"use client";

import { resolveOptionVisualState, type QuestionPhase } from "@/lib/quiz/play-flow";
import type { QuizQuestionPlay } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";
import Image from "next/image";

type QuizJerseyPickStageProps = {
  question: QuizQuestionPlay;
  selectedOptionId: string | null;
  phase: QuestionPhase;
  secondsLeft: number;
  locked: boolean;
  onSelect: (optionId: string) => void;
};

export function QuizJerseyPickStage({
  question,
  selectedOptionId,
  phase,
  secondsLeft,
  locked,
  onSelect,
}: QuizJerseyPickStageProps) {
  const timerUrgent = secondsLeft <= 5 && phase === "answering";
  const jerseyOptions = question.jerseyOptions || [];

  return (
    <div className="tm-quiz-stage flex flex-col gap-6 min-h-0 flex-1 justify-center py-4">
      <div className="flex justify-center shrink-0">
        <div
          className={cn(
            "tm-quiz-timer flex items-center justify-center rounded-2xl px-6 py-2",
            timerUrgent && "tm-quiz-timer--urgent"
          )}
          aria-live="polite"
        >
          <span className="tm-quiz-timer-value font-display text-4xl tabular-nums tracking-wide">
            {secondsLeft}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center text-center px-4 shrink-0">
        <p className="font-display text-lg md:text-xl font-bold leading-snug text-[var(--tm-fg)]">
          {question.prompt}
        </p>
      </div>

      <div className="grid grid-cols-2 grid-rows-2 flex-1 min-h-0 max-w-xl w-full mx-auto gap-3 md:gap-6 px-4 mt-2 mb-2">
        {jerseyOptions.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const visualState = resolveOptionVisualState({
            optionId: option.id,
            selectedOptionId,
            correctOptionId: question.correct_option_id,
            phase,
          });

          // Glow effects based on visual state
          let imageGlow = "";
          if (isSelected && phase === "answering") {
            imageGlow = "drop-shadow-[0_0_15px_rgba(212,255,0,0.8)] scale-105";
          } else if (visualState === "correct") {
            imageGlow = "drop-shadow-[0_0_15px_rgba(34,197,94,0.8)] scale-105";
          } else if (visualState === "wrong") {
            imageGlow = "drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] scale-105";
          } else if (phase === "feedback" && visualState === "default") {
            imageGlow = "opacity-50 grayscale";
          }

          return (
            <button
              key={option.id}
              disabled={locked}
              onClick={() => onSelect(option.id)}
              className="relative group flex flex-col items-center justify-center transition-all duration-300 h-full min-h-0"
            >
              <div className="relative w-full h-full p-2 flex items-center justify-center">
                <Image
                  src={`/api/laboratorio/jersey-crop?key=${option.imageKey}`}
                  alt={`${option.team} ${option.year} ${option.kit}`}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className={cn(
                    "object-contain mix-blend-multiply dark:mix-blend-screen transition-all duration-300",
                    !locked && "group-hover:scale-110",
                    imageGlow
                  )}
                  // Using mix-blend-screen or multiply depends on background. 
                  // If background is dark and image has white bg, multiply will hide the dark bg.
                  // Since image has white background, multiply will keep white (which is transparent in multiply).
                  // But wait, if container bg is dark, multiply(white, dark) = dark! So white becomes transparent!
                  // That is exactly what we want.
                />
              </div>

            </button>
          );
        })}
      </div>
    </div>
  );
}
