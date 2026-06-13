"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { QuizLeaderboardTable } from "@/components/quiz/QuizLeaderboardTable";
import { QuizWaitModal } from "@/components/quiz/QuizWaitModal";
import { QUIZ_COMING_SOON_MESSAGE } from "@/lib/quiz/date";
import {
  getLatestSubmittedAttemptId,
  getQuizPlayCta,
  shouldShowQuizAlreadyPlayedModal,
} from "@/lib/quiz/slot-status";
import type { QuizDayHub, QuizLeaderboardRow } from "@/lib/quiz/types";

const playButtonClass =
  "inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--tm-accent)] px-5 text-sm font-semibold text-[var(--tm-primary-fg)] transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

type QuizHubProps = {
  hub: QuizDayHub;
  leaderboardRows: QuizLeaderboardRow[];
  currentProfileId: string;
};

export function QuizHub({ hub, leaderboardRows, currentProfileId }: QuizHubProps) {
  const router = useRouter();
  const [waitModalOpen, setWaitModalOpen] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  const quizAvailable = Boolean(hub.official);
  const playCta = getQuizPlayCta(hub.official, {
    resultAttemptId: getLatestSubmittedAttemptId(hub.official),
  });

  function handlePlay() {
    if (hub.publishHeld || !quizAvailable || !hub.official) {
      setComingSoonOpen(true);
      return;
    }

    if (shouldShowQuizAlreadyPlayedModal(hub.official)) {
      setWaitModalOpen(true);
      return;
    }

    if (playCta?.entersPlay) {
      router.push(playCta.href);
    }
  }

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
            onClick={handlePlay}
            disabled={quizAvailable && !playCta?.entersPlay}
            className={playButtonClass}
          >
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

          <p className="text-center text-xs text-[var(--tm-muted)]">
            Un intento por día.
          </p>
        </section>
      </div>

      <QuizWaitModal
        open={waitModalOpen}
        onClose={() => setWaitModalOpen(false)}
        message="Hoy ya has jugado al quiz diario crack."
      />

      <QuizWaitModal
        open={comingSoonOpen}
        onClose={() => setComingSoonOpen(false)}
        message={QUIZ_COMING_SOON_MESSAGE}
      />
    </div>
  );
}
