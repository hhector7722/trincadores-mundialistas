"use client";

import { QuizLeaderboardTable } from "@/components/quiz/QuizLeaderboardTable";
import { useQuizEntry } from "@/components/quiz/QuizEntryProvider";
import { QUIZ_COMING_SOON_MESSAGE } from "@/lib/quiz/date";
import { getLatestSubmittedAttemptId, getQuizPlayCta } from "@/lib/quiz/slot-status";
import type { QuizDayHub, QuizLeaderboardRow } from "@/lib/quiz/types";

const playButtonClass =
  "inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--tm-accent)] px-5 text-sm font-semibold text-[var(--tm-primary-fg)] transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

type QuizHubProps = {
  hub: QuizDayHub;
  leaderboardRows: QuizLeaderboardRow[];
  currentProfileId: string;
};

export function QuizHub({ hub, leaderboardRows, currentProfileId }: QuizHubProps) {
  const { requestQuizEntry } = useQuizEntry();

  const quizAvailable = Boolean(hub.official);
  const playCta = getQuizPlayCta(hub.official, {
    resultAttemptId: getLatestSubmittedAttemptId(hub.official),
  });

  return (
    <div className="tm-quiz-hub">
      <div className="tm-quiz-hub-content">
        <section
          className="flex min-h-0 min-w-0 flex-1 flex-col"
          aria-label="Clasificacion del quiz"
        >
          <QuizLeaderboardTable
            rows={leaderboardRows}
            currentProfileId={currentProfileId}
          />
        </section>

        <section
          className="tm-quiz-hub-actions shrink-0 space-y-3 px-3 pt-3"
          aria-label="Jugar quiz diario"
        >
          <button
            type="button"
            onClick={requestQuizEntry}
            className={playButtonClass}
          >
            {playCta?.label ?? "JUGAR"}
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

          <p className="text-center text-xs text-[var(--tm-muted)]">
            Un intento por día.
          </p>
        </section>
      </div>
    </div>
  );
}
