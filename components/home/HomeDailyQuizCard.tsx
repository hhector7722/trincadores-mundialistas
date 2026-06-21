"use client";

import { useQuizEntry } from "@/components/quiz/QuizEntryProvider";
import { cn } from "@/lib/utils";
import type { MouseEvent } from "react";

type HomeDailyQuizCardProps = {
  className?: string;
};

export function HomeDailyQuizCard({ className }: HomeDailyQuizCardProps) {
  const { requestQuizEntry, navigateQuizHub } = useQuizEntry();

  function handleCardNavigate() {
    navigateQuizHub();
  }

  function handlePlay(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    requestQuizEntry();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardNavigate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleCardNavigate();
        }
      }}
      className={cn(
        "@container shrink-0 cursor-pointer rounded-2xl p-2 tm-stat-card",
        className
      )}
      data-tm-indicators-anchor="quiz-daily"
      aria-label="Ir al quiz diario"
    >
      <div className="grid min-w-0 grid-cols-2 items-center gap-2">
        <p className="flex min-w-0 items-center justify-center text-center text-[9px] font-semibold uppercase tracking-wide text-[#CCFF00]">
          Quiz diario
        </p>
        <button
          type="button"
          onClick={handlePlay}
          className={cn(
            "inline-flex w-full items-center justify-center whitespace-nowrap rounded-full",
            "bg-[#CCFF00] px-[clamp(8px,2.5cqw,10px)] pt-[clamp(3px,1cqw,4px)] pb-[clamp(2px,0.5cqw,2.5px)]",
            "text-[clamp(9px,2.4cqw,10px)] font-bold uppercase tracking-wide text-black",
            "transition-opacity hover:opacity-90 active:opacity-80"
          )}
        >
          Jugar
        </button>
      </div>
    </div>
  );
}
