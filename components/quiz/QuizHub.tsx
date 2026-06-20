"use client";

import { Play } from "lucide-react";
import { QuizLeaderboardTable } from "@/components/quiz/QuizLeaderboardTable";
import { useQuizEntry } from "@/components/quiz/QuizEntryProvider";
import { QUIZ_COMING_SOON_MESSAGE } from "@/lib/quiz/date";
import type { QuizDayHub, QuizLeaderboardRow } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

const PLAY_BUTTON_CLASS = cn(
  "inline-flex h-auto w-max shrink-0 items-center justify-center gap-1.5",
  "rounded-full bg-[#CCFF00] px-[clamp(8px,2.6cqw,10px)] py-[clamp(3px,1.25cqw,4px)]",
  "text-[10px] font-bold uppercase leading-none tracking-[0.12em] text-black",
  "transition-opacity hover:opacity-90 active:opacity-80",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

type QuizHubProps = {
  hub: QuizDayHub;
  leaderboardRows: QuizLeaderboardRow[];
  currentProfileId: string;
};

export function QuizHub({ hub, leaderboardRows, currentProfileId }: QuizHubProps) {
  const { requestQuizEntry } = useQuizEntry();

  const quizAvailable = Boolean(hub.official);

  return (
    <div className="tm-ranking-shell flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <QuizLeaderboardTable
        rows={leaderboardRows}
        currentProfileId={currentProfileId}
      />

      <div className="tm-ranking-evolution-trigger flex shrink-0 flex-col items-center gap-2 pt-2">
        <button
          type="button"
          onClick={requestQuizEntry}
          className={PLAY_BUTTON_CLASS}
          disabled={!quizAvailable}
        >
          <Play className="size-4 shrink-0" aria-hidden="true" />
          JUGAR
        </button>

        {hub.publishHeld && (
          <p className="text-center text-sm text-[var(--tm-muted)]">
            {QUIZ_COMING_SOON_MESSAGE}
          </p>
        )}

        {!quizAvailable && !hub.publishHeld && (
          <p className="text-center text-sm text-[var(--tm-muted)]">
            Todavia no hay quiz publicado para hoy. Vuelve mas tarde.
          </p>
        )}
      </div>
    </div>
  );
}
