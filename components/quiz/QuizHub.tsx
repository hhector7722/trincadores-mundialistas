"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { QuizLeaderboardTable } from "@/components/quiz/QuizLeaderboardTable";
import { QuizWaitModal } from "@/components/quiz/QuizWaitModal";
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

  const quizAvailable = Boolean(hub.official);
  const access = { isOwner: hub.isOwner };
  const playCta = getQuizPlayCta(hub.official, {
    ...access,
    resultAttemptId: getLatestSubmittedAttemptId(hub.official),
  });

  function handlePlay() {
    if (!quizAvailable || !hub.official) return;

    if (shouldShowQuizAlreadyPlayedModal(hub.official, access)) {
      setWaitModalOpen(true);
      return;
    }

    if (playCta?.entersPlay) {
      router.push(playCta.href);
    }
  }

  return (
    <div className="tm-quiz-hub">
      <div className="tm-quiz-hub-content space-y-6">
        <section className="space-y-3" aria-label="Jugar quiz diario">
          <button
            type="button"
            onClick={handlePlay}
            disabled={!quizAvailable || !playCta?.entersPlay}
            className={playButtonClass}
          >
            JUGAR
          </button>

          {!quizAvailable && (
            <p className="text-center text-sm text-[var(--tm-muted)]">
              Todavia no hay quiz publicado para hoy. Vuelve mas tarde.
            </p>
          )}

          <div className="space-y-1 text-center text-xs leading-relaxed text-[var(--tm-muted)]">
            <p>Un intento por dia. Puntuan a partir del 11 de junio.</p>
            <p>Los intentos previos son de entrenamiento.</p>
          </div>
        </section>

        <section className="space-y-2" aria-label="Clasificacion del quiz">
          <h2 className="font-display text-sm uppercase tracking-wide text-[var(--tm-fg)]">
            Clasificacion del quiz
          </h2>
          <QuizLeaderboardTable
            rows={leaderboardRows}
            currentProfileId={currentProfileId}
          />
        </section>
      </div>

      <QuizWaitModal
        open={waitModalOpen}
        onClose={() => setWaitModalOpen(false)}
        message="Ya has jugado el quiz diario de hoy. Espera a mañana crack."
      />
    </div>
  );
}
