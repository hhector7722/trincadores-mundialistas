"use client";

import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { QuizWaitModal } from "@/components/quiz/QuizWaitModal";
import {
  getLatestSubmittedAttemptId,
  getQuizPlayCta,
  shouldShowQuizAlreadyPlayedModal,
} from "@/lib/quiz/slot-status";
import type { QuizDayHub } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

type HomeDailyQuizCardProps = {
  quizHub: QuizDayHub;
  className?: string;
};

export function HomeDailyQuizCard({ quizHub, className }: HomeDailyQuizCardProps) {
  const router = useRouter();
  const [alreadyPlayedOpen, setAlreadyPlayedOpen] = useState(false);

  const playCta = getQuizPlayCta(quizHub.official, {
    resultAttemptId: getLatestSubmittedAttemptId(quizHub.official),
  });

  function handleCardNavigate() {
    router.push("/quiz");
  }

  function handlePlay(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    const slot = quizHub.official;
    if (!slot) {
      router.push("/quiz");
      return;
    }

    if (shouldShowQuizAlreadyPlayedModal(slot)) {
      setAlreadyPlayedOpen(true);
      return;
    }

    if (playCta?.entersPlay) {
      router.push(playCta.href);
      return;
    }

    router.push(playCta?.href ?? "/quiz");
  }

  return (
    <>
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
              "bg-[#CCFF00] px-[clamp(8px,2.5cqw,10px)] py-[clamp(3px,1cqw,4px)]",
              "text-[clamp(9px,2.4cqw,10px)] font-bold uppercase tracking-wide text-black",
              "transition-opacity hover:opacity-90 active:opacity-80"
            )}
          >
            Jugar
          </button>
        </div>
      </div>

      <QuizWaitModal
        open={alreadyPlayedOpen}
        onClose={() => setAlreadyPlayedOpen(false)}
        message="Ya has jugado el quiz diario de hoy. Espera a mañana crack"
      />
    </>
  );
}
