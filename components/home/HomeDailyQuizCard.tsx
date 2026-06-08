"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { canOpenQuizPlay, getQuizSlotStatus } from "@/lib/quiz/slot-status";
import type { QuizDayHub } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

type HomeDailyQuizCardProps = {
  quizHub: QuizDayHub;
};

export function HomeDailyQuizCard({ quizHub }: HomeDailyQuizCardProps) {
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
        className="@container flex h-full min-h-12 min-w-0 flex-col justify-center rounded-2xl p-[clamp(0.5rem,3cqw,0.75rem)] tm-stat-card"
        aria-label="Quiz diario"
      >
        <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-[#CCFF00]">
          Quiz diario
        </p>
        <button
          type="button"
          onClick={handlePlay}
          className={cn(
            "mt-2 inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-full",
            "bg-[#CCFF00] px-[clamp(8px,2.5cqw,10px)] py-[clamp(3px,1cqw,4px)]",
            "text-[clamp(9px,2.4cqw,10px)] font-bold uppercase tracking-wide text-black",
            "transition-opacity hover:opacity-90 active:opacity-80"
          )}
        >
          Jugar
        </button>
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
