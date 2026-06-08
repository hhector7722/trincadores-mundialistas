"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { canOpenQuizPlay, getQuizSlotStatus } from "@/lib/quiz/slot-status";
import type { QuizDayHub } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

type HomeDailyQuizCardProps = {
  quizHub: QuizDayHub;
  className?: string;
};

export function HomeDailyQuizCard({ quizHub, className }: HomeDailyQuizCardProps) {
  const router = useRouter();
  const [alreadyPlayedOpen, setAlreadyPlayedOpen] = useState(false);

  function handlePlay() {
    const slot = quizHub.official;
    const canPlay = canOpenQuizPlay(slot, slot?.quiz.scoring_mode, {
      isOwner: quizHub.isOwner,
    });

    if (canPlay) {
      router.push("/quiz/play");
      return;
    }

    if (slot && getQuizSlotStatus(slot) === "completed") {
      setAlreadyPlayedOpen(true);
      return;
    }

    router.push("/quiz");
  }

  return (
    <>
      <div
        className={cn(
          "@container shrink-0 rounded-2xl p-2 tm-stat-card",
          className
        )}
        aria-label="Quiz diario"
      >
        <div className="flex min-w-0 items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[9px] font-semibold uppercase tracking-wide text-[#CCFF00]">
            Quiz diario
          </p>
          <button
            type="button"
            onClick={handlePlay}
            className={cn(
              "inline-flex shrink-0 items-center whitespace-nowrap rounded-full",
              "bg-[#CCFF00] px-[clamp(8px,2.5cqw,10px)] py-[clamp(3px,1cqw,4px)]",
              "text-[clamp(9px,2.4cqw,10px)] font-bold uppercase tracking-wide text-black",
              "transition-opacity hover:opacity-90 active:opacity-80"
            )}
          >
            Jugar
          </button>
        </div>
      </div>

      <Modal
        open={alreadyPlayedOpen}
        onClose={() => setAlreadyPlayedOpen(false)}
        title="Quiz diario"
      >
        <p className="text-sm leading-relaxed text-[var(--tm-fg)]">
          Ya has jugado el quiz diario de hoy. Espera a mañana crack
        </p>
      </Modal>
    </>
  );
}
