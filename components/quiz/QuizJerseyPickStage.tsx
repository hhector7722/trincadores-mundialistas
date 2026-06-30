"use client";

import { resolveOptionVisualState, type QuestionPhase } from "@/lib/quiz/play-flow";
import type { QuizQuestionPlay } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";
import Image from "next/image";

import { JERSEY_CROP_MAP } from "@/lib/quiz/lab/jersey-crop-map";

const FILE_DIMENSIONS: Record<string, [number, number]> = {
  'alemania.png': [1129, 877],
  'argentina.png': [2400, 1603],
  'belgica.png': [2400, 1427],
  'brasil.png': [3323, 3029],
  'corea.png': [2400, 1217],
  'croacia.png': [2400, 830],
  'españa.png': [2400, 1522],
  'francia.png': [2400, 1416],
  'inglaterra.png': [2400, 1308],
  'japon.png': [2400, 797],
  'marruecos.png': [2400, 816],
  'mejico.png': [2400, 1392],
  'peru.png': [2400, 915],
  'portugal.png': [2400, 809],
  'rusia.png': [2400, 1166],
  'senegal.png': [2400, 695],
  'suiza.png': [2400, 1072],
  'uruguay.png': [2400, 1527],
};

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
          } else if (visualState === "correct" || visualState === "revealed") {
            imageGlow = "drop-shadow-[0_0_15px_rgba(34,197,94,0.8)] scale-105";
          } else if (visualState === "wrong") {
            imageGlow = "drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] scale-105";
          } else if (phase === "feedback" && visualState === "default") {
            imageGlow = "opacity-50 grayscale";
          }

          const crop = JERSEY_CROP_MAP[option.imageKey];
          let svgElement = null;

          if (crop) {
            const [w, h] = FILE_DIMENSIONS[crop.file] || [2400, 1500];
            const cx = crop.pX * w;
            const cy = crop.pY * h;
            const cw = crop.pWidth * w;
            const ch = crop.pHeight * h;

            svgElement = (
              <svg 
                viewBox={`${cx} ${cy} ${cw} ${ch}`} 
                width="100%" 
                height="100%"
                className={cn(
                  "transition-all duration-300 mix-blend-multiply dark:mix-blend-screen",
                  !locked && "group-hover:scale-110",
                  imageGlow
                )}
              >
                <image 
                  href={`/_next/image?url=${encodeURIComponent(`/images/equipaciones/${crop.file}`)}&w=1080&q=75`} 
                  width={w} 
                  height={h} 
                />
              </svg>
            );
          }

          return (
            <button
              key={option.id}
              disabled={locked}
              onClick={() => onSelect(option.id)}
              className="relative group flex flex-col items-center justify-center transition-all duration-300 h-full min-h-0"
              aria-label="Seleccionar esta camiseta"
            >
              <div className="relative w-full h-full p-2 flex items-center justify-center">
                {svgElement}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
